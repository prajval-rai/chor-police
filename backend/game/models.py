import secrets

from django.db import models

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I confusion


def new_room_code():
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))


def new_token():
    return secrets.token_urlsafe(32)


class Room(models.Model):
    LOBBY = "lobby"
    STARTING = "starting"
    ROLE_REVEAL = "role_reveal"
    PUBLIC_REVEAL = "public_reveal"
    GUESSING = "guessing"
    RESULT = "result"
    GAME_OVER = "game_over"

    code = models.CharField(max_length=6, unique=True)
    phase = models.CharField(max_length=20, default=LOBBY)
    phase_started = models.DateTimeField(null=True, blank=True)
    phase_deadline = models.DateTimeField(null=True, blank=True)
    round_number = models.PositiveIntegerField(default=0)
    total_rounds = models.PositiveIntegerField(default=5)
    # Bumped on every change so clients can cheaply detect new state.
    version = models.PositiveIntegerField(default=0)
    notice = models.CharField(max_length=120, blank=True)

    guess_target = models.ForeignKey(
        "Player", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    guess_correct = models.BooleanField(null=True, blank=True)
    guess_timed_out = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Room {self.code} ({self.phase})"


class Player(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="players")
    nickname = models.CharField(max_length=16)
    token = models.CharField(max_length=64, unique=True, default=new_token)
    seat = models.PositiveSmallIntegerField()
    is_host = models.BooleanField(default=False)
    # Secret for the current round. Never serialized for other players unless
    # the game rules make it public (see game/logic.py: role_visible_to).
    role = models.CharField(max_length=10, blank=True)
    round_points = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    rounds_won = models.PositiveIntegerField(default=0)
    last_seen = models.DateTimeField(auto_now_add=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["seat"]

    def __str__(self):
        return f"{self.nickname} @ {self.room.code}"
