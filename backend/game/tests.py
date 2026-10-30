from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .logic import CHOR, MANTRI, PUBLIC_ROLES, RAJA, SIPAHI
from .models import Player, Room


class GameFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        res = self.client.post("/api/rooms", {"nickname": "Asha"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.code = res.data["code"]
        self.tokens = [res.data["token"]]
        for name in ["Bilal", "Chetan", "Divya"]:
            res = self.client.post(
                f"/api/rooms/{self.code}/join", {"nickname": name}, format="json"
            )
            self.assertEqual(res.status_code, 201)
            self.tokens.append(res.data["token"])

    def call(self, method, action, token, data=None):
        return getattr(self.client, method)(
            f"/api/rooms/{self.code}/{action}",
            data or {},
            format="json",
            HTTP_X_PLAYER_TOKEN=token,
        )

    def expire_phase(self):
        Room.objects.filter(code=self.code).update(
            phase_deadline=timezone.now() - timedelta(seconds=5)
        )

    def state(self, token):
        return self.call("get", "state", token).data

    def token_for(self, role):
        return Player.objects.get(room__code=self.code, role=role).token

    def start_and_reach_guessing(self):
        self.assertEqual(self.call("post", "start", self.tokens[0]).status_code, 200)
        self.expire_phase()  # starting -> role_reveal (roles dealt)
        self.assertEqual(self.state(self.tokens[0])["phase"], "role_reveal")
        self.expire_phase()
        self.assertEqual(self.state(self.tokens[0])["phase"], "public_reveal")
        self.expire_phase()
        self.assertEqual(self.state(self.tokens[0])["phase"], "guessing")

    def test_fifth_player_rejected_and_non_host_cannot_start(self):
        res = self.client.post(
            f"/api/rooms/{self.code}/join", {"nickname": "Eve"}, format="json"
        )
        self.assertEqual(res.status_code, 409)
        self.assertEqual(self.call("post", "start", self.tokens[1]).status_code, 403)

    def test_roles_are_private_until_rules_reveal_them(self):
        self.call("post", "start", self.tokens[0])
        self.expire_phase()
        for token in self.tokens:
            data = self.state(token)
            me = data["me"]["id"]
            self.assertIsNotNone(data["me"]["role"])
            for p in data["players"]:
                if p["id"] != me:
                    self.assertIsNone(p["role"], "role leaked during private reveal")

        self.expire_phase()
        data = self.state(self.token_for(MANTRI))
        visible = {p["role"] for p in data["players"] if p["role"]}
        self.assertEqual(visible, PUBLIC_ROLES | {MANTRI})
        data = self.state(self.token_for(RAJA))
        self.assertNotIn(CHOR, {p["role"] for p in data["players"]})

    def test_correct_guess_scores_sipahi(self):
        self.start_and_reach_guessing()
        chor = Player.objects.get(room__code=self.code, role=CHOR)
        # Only the Sipahi may guess.
        res = self.call("post", "guess", self.token_for(RAJA), {"target_id": chor.pk})
        self.assertEqual(res.status_code, 403)
        res = self.call("post", "guess", self.token_for(SIPAHI), {"target_id": chor.pk})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["phase"], "result")
        self.assertTrue(res.data["result"]["correct"])
        points = {p["role"]: p["round_points"] for p in res.data["players"]}
        self.assertEqual(points, {RAJA: 1000, MANTRI: 800, SIPAHI: 500, CHOR: 0})

    def test_wrong_guess_lets_chor_escape(self):
        self.start_and_reach_guessing()
        mantri = Player.objects.get(room__code=self.code, role=MANTRI)
        res = self.call("post", "guess", self.token_for(SIPAHI), {"target_id": mantri.pk})
        self.assertFalse(res.data["result"]["correct"])
        points = {p["role"]: p["round_points"] for p in res.data["players"]}
        self.assertEqual(points[SIPAHI], 0)
        self.assertEqual(points[CHOR], 500)

    def test_cannot_accuse_public_player(self):
        self.start_and_reach_guessing()
        raja = Player.objects.get(room__code=self.code, role=RAJA)
        res = self.call("post", "guess", self.token_for(SIPAHI), {"target_id": raja.pk})
        self.assertEqual(res.status_code, 400)

    def test_timeout_counts_as_escape(self):
        self.start_and_reach_guessing()
        self.expire_phase()
        data = self.state(self.tokens[0])
        self.assertEqual(data["phase"], "result")
        self.assertTrue(data["result"]["timed_out"])
        self.assertFalse(data["result"]["correct"])

    def test_full_game_ends_after_five_rounds(self):
        for round_no in range(1, 6):
            if round_no == 1:
                self.start_and_reach_guessing()
            else:
                self.call("post", "next", self.tokens[0])
                for _ in range(2):  # role_reveal -> public_reveal -> guessing
                    self.expire_phase()
                    self.state(self.tokens[0])
            self.expire_phase()
            data = self.state(self.tokens[0])
            self.assertEqual((data["phase"], data["round"]), ("result", round_no))
        data = self.call("post", "next", self.tokens[0]).data
        self.assertEqual(data["phase"], "game_over")
        self.assertEqual(sum(p["total_points"] for p in data["players"]), 5 * 2300)

    def test_leaving_mid_game_returns_to_lobby(self):
        self.start_and_reach_guessing()
        self.call("post", "leave", self.tokens[2])
        data = self.state(self.tokens[0])
        self.assertEqual(data["phase"], "lobby")
        self.assertEqual(len(data["players"]), 3)
        self.assertIn("left", data["notice"])
