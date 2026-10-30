"""Chor Police rules and the room state machine.

All game state lives on the server. Phases with a deadline advance lazily: any
request that touches a room first calls ``advance()``, which moves the room
forward through every phase whose deadline has passed. That makes the Sipahi's
20s timer authoritative without a background worker.
"""

import random
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import Player, Room

RAJA, MANTRI, SIPAHI, CHOR = "raja", "mantri", "sipahi", "chor"
ROLES = [RAJA, MANTRI, SIPAHI, CHOR]
POINTS = {RAJA: 1000, MANTRI: 800, SIPAHI: 500, CHOR: 0}

# Roles shown to everyone before the guess. Sipahi must be public (everyone has
# to see who is investigating); the guess is between the two hidden players.
# With Raja + Mantri public instead, the Sipahi would know the Chor for certain.
PUBLIC_ROLES = {RAJA, SIPAHI}

MAX_PLAYERS = 4

# Seconds each timed phase lasts. RESULT, LOBBY and GAME_OVER wait for the host.
DURATIONS = {
    Room.STARTING: 4,        # 3-2-1 + "LET THE GAME BEGIN!"
    Room.ROLE_REVEAL: 8,     # private 3D card flip
    Room.PUBLIC_REVEAL: 6,   # Raja and Sipahi step forward
    Room.GUESSING: 20,       # Sipahi's decision
}

# Grace period so a guess sent at 19.9s isn't lost to network latency.
GUESS_GRACE = timedelta(seconds=1.5)


class GameError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def set_phase(room, phase):
    now = timezone.now()
    room.phase = phase
    room.phase_started = now
    seconds = DURATIONS.get(phase)
    room.phase_deadline = now + timedelta(seconds=seconds) if seconds else None
    room.version += 1


def deal_roles(room):
    players = list(room.players.all())
    roles = ROLES[:]
    random.shuffle(roles)
    for player, role in zip(players, roles):
        player.role = role
        player.round_points = 0
    Player.objects.bulk_update(players, ["role", "round_points"])
    room.round_number += 1
    room.guess_target = None
    room.guess_correct = None
    room.guess_timed_out = False
    room.notice = ""
    set_phase(room, Room.ROLE_REVEAL)


def resolve_guess(room, target):
    """Score the round. ``target`` is None when the Sipahi ran out of time,
    which counts as a wrong guess: the Chor escapes."""
    players = {p.role: p for p in room.players.all()}
    correct = target is not None and target.role == CHOR

    for role, player in players.items():
        player.round_points = POINTS[role]
    if correct:
        players[SIPAHI].rounds_won += 1
    else:
        # The Chor escapes with the Sipahi's points.
        players[CHOR].round_points = POINTS[SIPAHI]
        players[SIPAHI].round_points = 0
        players[CHOR].rounds_won += 1
    for player in players.values():
        player.total_points += player.round_points
    Player.objects.bulk_update(
        players.values(), ["round_points", "total_points", "rounds_won"]
    )

    room.guess_target = target
    room.guess_correct = correct
    room.guess_timed_out = target is None
    set_phase(room, Room.RESULT)


def _step(room):
    """Advance one expired phase. Returns False when nothing was due."""
    if not room.phase_deadline or timezone.now() < room.phase_deadline:
        return False
    if room.phase == Room.STARTING:
        deal_roles(room)
    elif room.phase == Room.ROLE_REVEAL:
        set_phase(room, Room.PUBLIC_REVEAL)
    elif room.phase == Room.PUBLIC_REVEAL:
        set_phase(room, Room.GUESSING)
    elif room.phase == Room.GUESSING:
        if timezone.now() < room.phase_deadline + GUESS_GRACE:
            return False
        resolve_guess(room, None)
    else:
        return False
    return True


def advance(room):
    """Bring a room up to date. Cheap when nothing is due."""
    if not room.phase_deadline or timezone.now() < room.phase_deadline:
        return room
    with transaction.atomic():
        room = Room.objects.select_for_update().get(pk=room.pk)
        changed = False
        while _step(room):
            changed = True
        if changed:
            room.save()
    return room


def reset_scores(room):
    room.players.update(role="", round_points=0, total_points=0, rounds_won=0)
    room.round_number = 0
    room.guess_target = None
    room.guess_correct = None
    room.guess_timed_out = False


def reseat(room):
    for seat, player in enumerate(room.players.order_by("seat", "joined_at")):
        if player.seat != seat:
            player.seat = seat
            player.save(update_fields=["seat"])


# --- Serialization -----------------------------------------------------------

def role_visible_to(room, player, viewer):
    """The only place that decides whether ``viewer`` may see ``player``'s role."""
    if not player.role:
        return False
    if player.pk == viewer.pk:
        return True
    if room.phase in (Room.RESULT, Room.GAME_OVER):
        return True
    if room.phase in (Room.PUBLIC_REVEAL, Room.GUESSING):
        return player.role in PUBLIC_ROLES
    return False


ONLINE_WINDOW = timedelta(seconds=12)


def serialize_room(room, viewer):
    now = timezone.now()
    players = list(room.players.all())
    show_scores = room.phase in (Room.RESULT, Room.GAME_OVER)

    ranked = sorted(players, key=lambda p: (-p.total_points, -p.rounds_won, p.seat))
    leader = ranked[0] if ranked and ranked[0].total_points > 0 else None

    data = {
        "code": room.code,
        "phase": room.phase,
        "version": room.version,
        "server_now": now.isoformat(),
        "phase_started": room.phase_started.isoformat() if room.phase_started else None,
        "phase_deadline": room.phase_deadline.isoformat() if room.phase_deadline else None,
        "round": room.round_number,
        "total_rounds": room.total_rounds,
        "max_players": MAX_PLAYERS,
        "notice": room.notice,
        "leader_id": leader.pk if leader else None,
        "players": [
            {
                "id": p.pk,
                "nickname": p.nickname,
                "seat": p.seat,
                "is_host": p.is_host,
                "online": now - p.last_seen < ONLINE_WINDOW,
                "role": p.role if role_visible_to(room, p, viewer) else None,
                "round_points": p.round_points if show_scores else None,
                "total_points": p.total_points,
                "rounds_won": p.rounds_won,
            }
            for p in players
        ],
        "me": {
            "id": viewer.pk,
            "nickname": viewer.nickname,
            "is_host": viewer.is_host,
            "role": viewer.role or None,
            "points": POINTS.get(viewer.role) if viewer.role else None,
        },
        "result": None,
    }
    if show_scores and room.guess_correct is not None:
        data["result"] = {
            "target_id": room.guess_target_id,
            "correct": room.guess_correct,
            "timed_out": room.guess_timed_out,
        }
    return data
