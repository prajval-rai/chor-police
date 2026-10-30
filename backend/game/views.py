from datetime import timedelta
from functools import wraps

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import logic
from .logic import GameError
from .models import Player, Room, new_room_code

TOKEN_HEADER = "HTTP_X_PLAYER_TOKEN"


def error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"error": message}, status=code)


def clean_nickname(raw):
    nickname = " ".join(str(raw or "").split())[:16]
    if not nickname:
        raise GameError("Please enter a nickname.")
    return nickname


def unique_nickname(room, nickname):
    taken = {p.nickname.lower() for p in room.players.all()}
    candidate, n = nickname, 2
    while candidate.lower() in taken:
        suffix = f" {n}"
        candidate = nickname[: 16 - len(suffix)] + suffix
        n += 1
    return candidate


def player_view(fn):
    """Resolve the room and the calling player from the URL code and the
    X-Player-Token header, bring the room up to date, then call
    ``fn(request, room, player)``. Responds with the caller's view of the room
    unless ``fn`` returns its own Response."""

    @wraps(fn)
    def wrapper(request, code):
        token = request.META.get(TOKEN_HEADER, "")
        player = (
            Player.objects.select_related("room")
            .filter(token=token, room__code=code.upper())
            .first()
            if token
            else None
        )
        if player is None:
            if not Room.objects.filter(code=code.upper()).exists():
                return error("Room not found.", status.HTTP_404_NOT_FOUND)
            return error("You are not in this room.", status.HTTP_403_FORBIDDEN)

        room = logic.advance(player.room)
        now = timezone.now()
        if now - player.last_seen > timedelta(seconds=4):
            Player.objects.filter(pk=player.pk).update(last_seen=now)

        try:
            response = fn(request, room, player)
        except GameError as exc:
            return error(exc.message, exc.status)
        if response is not None:
            return response
        room.refresh_from_db()
        player.refresh_from_db()
        return Response(logic.serialize_room(room, player))

    return wrapper


def locked(room):
    return Room.objects.select_for_update().get(pk=room.pk)


def require_host(player):
    if not player.is_host:
        raise GameError("Only the host can do that.", status.HTTP_403_FORBIDDEN)


# --- Endpoints ---------------------------------------------------------------

@api_view(["POST"])
def create_room(request):
    try:
        nickname = clean_nickname(request.data.get("nickname"))
    except GameError as exc:
        return error(exc.message)
    for _ in range(10):
        try:
            with transaction.atomic():
                room = Room.objects.create(code=new_room_code())
                player = Player.objects.create(
                    room=room, nickname=nickname, seat=0, is_host=True
                )
            break
        except IntegrityError:
            continue  # code collision, try another
    else:
        return error("Could not create a room, please retry.", 503)
    return Response(
        {"code": room.code, "token": player.token, "player_id": player.pk},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def room_info(request, code):
    """Public lobby info for the join screen. Contains no roles."""
    room = Room.objects.filter(code=code.upper()).first()
    if room is None:
        return error("Room not found. Check the code and try again.", 404)
    return Response(
        {
            "code": room.code,
            "phase": room.phase,
            "players": room.players.count(),
            "max_players": logic.MAX_PLAYERS,
        }
    )


@api_view(["POST"])
def join_room(request, code):
    try:
        nickname = clean_nickname(request.data.get("nickname"))
    except GameError as exc:
        return error(exc.message)
    with transaction.atomic():
        room = Room.objects.select_for_update().filter(code=code.upper()).first()
        if room is None:
            return error("Room not found. Check the code and try again.", 404)
        if room.phase != Room.LOBBY:
            return error("This game has already started.", 409)
        count = room.players.count()
        if count >= logic.MAX_PLAYERS:
            return error("This room is full (4/4).", 409)
        player = Player.objects.create(
            room=room, nickname=unique_nickname(room, nickname), seat=count
        )
        room.notice = ""
        room.version += 1
        room.save()
    return Response(
        {"code": room.code, "token": player.token, "player_id": player.pk},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@player_view
def room_state(request, room, player):
    return None


@api_view(["POST"])
@player_view
def start_game(request, room, player):
    require_host(player)
    with transaction.atomic():
        room = locked(room)
        if room.phase not in (Room.LOBBY, Room.GAME_OVER):
            raise GameError("The game is already running.", 409)
        if room.players.count() != logic.MAX_PLAYERS:
            raise GameError("Chor Police needs exactly 4 players.")
        logic.reset_scores(room)
        room.notice = ""
        logic.set_phase(room, Room.STARTING)
        room.save()


@api_view(["POST"])
@player_view
def submit_guess(request, room, player):
    try:
        target_id = int(request.data.get("target_id"))
    except (TypeError, ValueError):
        raise GameError("Pick a player.")
    with transaction.atomic():
        room = locked(room)
        player.refresh_from_db()
        if room.phase != Room.GUESSING:
            raise GameError("It's not time to guess.", 409)
        if player.role != logic.SIPAHI:
            raise GameError("Only the Sipahi can catch the Chor.", 403)
        target = room.players.filter(pk=target_id).first()
        if target is None or target.role in logic.PUBLIC_ROLES:
            raise GameError("You can only accuse a hidden player.")
        logic.resolve_guess(room, target)
        room.save()


@api_view(["POST"])
@player_view
def next_round(request, room, player):
    require_host(player)
    with transaction.atomic():
        room = locked(room)
        if room.phase != Room.RESULT:
            raise GameError("The round isn't over yet.", 409)
        if room.round_number >= room.total_rounds:
            logic.set_phase(room, Room.GAME_OVER)
        else:
            logic.deal_roles(room)
        room.save()


@api_view(["POST"])
@player_view
def leave_room(request, room, player):
    with transaction.atomic():
        room = locked(room)
        was_host = player.is_host
        nickname = player.nickname
        player.delete()
        remaining = room.players.order_by("seat")
        if not remaining.exists():
            room.delete()
            return Response({"left": True})
        if was_host:
            new_host = remaining.first()
            new_host.is_host = True
            new_host.save(update_fields=["is_host"])
        logic.reseat(room)
        if room.phase != Room.LOBBY:
            # A round can't continue with 3 players: back to the lobby.
            logic.reset_scores(room)
            logic.set_phase(room, Room.LOBBY)
            room.notice = f"{nickname} left the game. Waiting for a 4th player."
        else:
            room.version += 1
        room.save()
    return Response({"left": True})
