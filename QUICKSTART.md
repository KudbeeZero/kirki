# Simcoin — Quickstart (run it on your desktop)

This gets Simcoin running on **macOS, Windows, or Linux** in a couple of minutes.

There are two ways to run it:

| Path | What you get | Needs |
| --- | --- | --- |
| **A. Web app only** (recommended first) | The full themed UI — dashboard, markets, trade ticket, leaderboard, profile, achievements, onboarding — with realistic demo data | Node + pnpm only |
| **B. Full stack** | Postgres + Redis + backend services (auth + trading + market are wired and tested; others are in progress) | Docker too |

> Today the web UI runs on **typed mock data**, so Path A needs no database and
> no API keys — it's the fastest way to see and click through the product. Path
> B is for working on the live backend.

---

## 0. Prerequisites (one-time)

**Install Node.js 20+ (22 recommended)** from <https://nodejs.org>.

**Enable pnpm** (ships with Node via Corepack — no separate install):

```bash
corepack enable
```

Verify:

```bash
node -v   # v20+ (v22 ideal)
pnpm -v   # 9.x
```

<details>
<summary>Windows notes</summary>

Run the commands in **PowerShell** or **Windows Terminal**. If `corepack enable`
reports a permissions error, open the terminal "as Administrator" once and rerun
it. Everything else is identical.
</details>

---

## 1. Get the code

Either **download the ZIP** from GitHub (green `Code` button → *Download ZIP*,
on the `claude/simcoin-review-growth-grw9sp` branch) and unzip it, **or** clone:

```bash
git clone <your-repo-url> simcoin
cd simcoin
git checkout claude/simcoin-review-growth-grw9sp
```

---

## Path A — Run the web app (fastest)

```bash
pnpm install
pnpm --filter @simcoin/web dev
```

Then open **<http://localhost:3000>**.

That's it. No `.env`, no database, no keys. You can navigate the whole app:
landing → onboarding → dashboard → markets → trade → leaderboard → profile →
achievements → learn.

To build a production bundle instead:

```bash
pnpm --filter @simcoin/web build
pnpm --filter @simcoin/web start
```

---

## Path B — Run the full stack (backend services)

Use this when you want the live API rather than mock data.

### 1. Start infrastructure (Postgres + Redis)

Requires **Docker Desktop** (<https://www.docker.com/products/docker-desktop/>),
running.

```bash
cp .env.example .env          # defaults work out of the box for local dev
docker compose up -d          # starts Postgres (:5432) + Redis (:6379)
```

Postgres auto-applies the schema in `database/schemas/` on first boot. Then load
the reference/demo data:

```bash
pnpm db:seed                  # markets, the genesis season, achievements, lessons
```

### 2. Run a backend service

Each service is its own app. The ones that are wired and tested today:

```bash
pnpm --filter @simcoin/auth-service dev      # http://localhost:4001
pnpm --filter @simcoin/market-service dev    # http://localhost:4002 (live price feed)
pnpm --filter @simcoin/trading-service dev   # http://localhost:4004 (order engine)
```

> **Status:** `auth`, `market`, and `trading` services build, run, and are unit-
> tested. `portfolio`, `league`, `social`, `nft`, `education`, and
> `notification` are scaffolded but not yet hardened, and there is **no API
> gateway yet**, so the web app does not call live services end-to-end. See
> `docs/build-backlog.md` for exactly what's done and what's next.

---

## Running the tests

```bash
pnpm test          # all workspace tests (game-engine, shared, trading, auth, market)
```

Expected: **green across every package** — 84 tests today.

---

## Troubleshooting

- **`pnpm: command not found`** → run `corepack enable` (see step 0).
- **Port 3000 already in use** → `WEB_PORT=3005 pnpm --filter @simcoin/web dev`.
- **`docker compose` can't connect** → make sure Docker Desktop is actually
  running, then retry.
- **Wrong Node version errors** → this repo needs Node ≥ 20; check with `node -v`.
- **Want to reset the database** → `docker compose down -v` then `docker compose up -d`
  (the `-v` wipes the Postgres volume so the schema re-applies cleanly).

---

Full architecture, API, and game-design docs live under [`docs/`](./docs).
