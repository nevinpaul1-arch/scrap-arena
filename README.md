# Scrap Arena

Top-down car demolition derby. Single-file HTML game.

Play: https://scrap-arena.3dp.workers.dev

- `index.html` — the game (served by the Worker straight from this repo)
- `worker/worker.js` — Cloudflare Worker: serves the game + leaderboard / daily-challenge API (D1 database `scrap-arena`)
