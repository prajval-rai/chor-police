# Chor Police: Royal Night

An online, 4-player version of the Indian party game *Raja Mantri Chor Sipahi*.

- **frontend/**: Next.js 16 (App Router, TypeScript) and Framer Motion
- **backend/**: Django 5.2 and Django REST Framework, with function-based `@api_view` endpoints and SQLite

## Run it locally

```bash
# 1. API (http://127.0.0.1:8000)
cd backend
python -m venv .venv
.venv/Scripts/activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 2. Web app (http://localhost:3000), in a second terminal
cd frontend
npm install
npm run dev
```

Next.js proxies `/api/*` to Django (see `frontend/next.config.ts`), so the browser only ever talks to one origin. Set `API_ORIGIN` to point at a different backend.

To play with friends on the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and share `http://<your-LAN-IP>:3000`.

## Rules as implemented

1. Exactly 4 players. Each gets a secret role: Raja (1000), Mantri (800), Sipahi (500) or Chor (0).
2. Raja and Sipahi are revealed to everyone. Mantri and Chor stay hidden.
3. The Sipahi has 20 seconds to accuse one of the two hidden players.
4. Caught: the Sipahi keeps 500 and wins the round. Wrong guess or timeout: the Chor steals the Sipahi's 500 and wins the round.
5. 5 rounds. The highest total wins (ties are broken by rounds won).

> The Sipahi must be public, so the guess is between Mantri and Chor. If Raja and Mantri were revealed instead, the Sipahi would always know the Chor. To change which roles are public, edit `PUBLIC_ROLES` in `backend/game/logic.py`.

## How it works

- **The server is authoritative.** All state lives in Django. Timed phases (`starting → role_reveal → public_reveal → guessing`) advance lazily: every request first calls `logic.advance()`, which moves the room past any expired deadline. That's how the Sipahi's timeout is enforced without a background worker. A 1.5s grace period absorbs network latency.
- **Secrecy.** Each player authenticates with a random per-player token (`X-Player-Token` header, kept in `localStorage`). `logic.role_visible_to()` is the single place that decides which roles appear in a player's payload. Other players' roles are never sent until the game rules make them public.
- **Sync.** Clients poll `GET /api/rooms/<code>/state` about once a second. Countdown timers use the server clock offset, so all players see the same deadline.

| Method | Endpoint | Who |
| --- | --- | --- |
| POST | `/api/rooms` | create room `{nickname}` → `{code, token}` |
| GET | `/api/rooms/<code>` | public lobby info (no roles) |
| POST | `/api/rooms/<code>/join` | join `{nickname}` → `{code, token}` |
| GET | `/api/rooms/<code>/state` | your view of the room |
| POST | `/api/rooms/<code>/start` | host: start or play again |
| POST | `/api/rooms/<code>/guess` | Sipahi: `{target_id}` |
| POST | `/api/rooms/<code>/next` | host: next round / final results |
| POST | `/api/rooms/<code>/leave` | leave (mid-game: room returns to lobby) |

## Art and sound

Everything is original:

- The four characters are hand-built SVG illustrations (`frontend/src/components/Characters.tsx`).
- All sound effects and the background music (a tanpura-style drone with a Bhairav-scale melody) are synthesized live with the Web Audio API (`frontend/src/lib/audio.ts`). There are no audio files to license.
- Audio only starts after the first user interaction. Music is off by default. Mute, music and volume controls sit in the bottom-right corner.
- Animations honour `prefers-reduced-motion`.

## Tests

```bash
cd backend && python manage.py test game
```

The tests cover the full 5-round game, role secrecy per phase, correct and wrong guesses, the timeout outcome, and a player leaving mid-game.
