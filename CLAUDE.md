# CLAUDE.md — Simcoin project memory

> This file is auto-loaded at the start of every Claude Code session. It is the
> fast-onboarding brief: what Simcoin is, how it's built, what's done, the
> conventions to follow, and what to work on next. Keep it current — when you
> finish meaningful work, update the **Status** and **Next up** sections (and
> `docs/build-backlog.md`).

## What Simcoin is

**Duolingo for crypto trading.** A fantasy crypto-trading platform with
educational gamification: players get simulated money, trade simulated assets
against **real, live prices**, compete in 30-day seasons, climb league tiers,
earn XP/achievements, and learn. **No real money, no real risk.**

> Mental model: Fantasy Football + TradingView + Duolingo + Clash Royale Seasons.

## Tech stack & layout

pnpm monorepo (Node ≥ 20, pnpm 9, TypeScript, turbo).

```
apps/        web (Next.js 15 — primary client), mobile (Expo), admin (Next.js)
services/    NestJS microservices: auth, market, trading, portfolio, league,
             social, nft, education, notification
packages/    types (source of truth), sdk (typed API client), ui (ShadCN-based),
             game-engine (pure: xp/league/season/pnl/achievements), shared
             (decimal money math, redis facade, config, logging)
blockchain/  algorand, solana, icp adapters (optional, never required to play)
database/    schemas/ (canonical SQL), migrations/ (forward-only), seeds/
docs/        architecture, api, game-design, tokenomics, roadmap, build-backlog
```

Infra: **Postgres** (system of record) + **Redis** (cache, pub/sub, leaderboard
sorted-sets). `docker-compose.yml` runs Postgres+Redis; app services run on host
via `pnpm dev`.

## How to run

See **QUICKSTART.md**. TL;DR:
- **Web UI only (no DB needed — runs on typed mock data):**
  `pnpm install && pnpm --filter @simcoin/web dev` → http://localhost:3000
- **Full stack:** `cp .env.example .env && docker compose up -d && pnpm db:seed`,
  then `pnpm --filter @simcoin/<svc>-service dev`.
- **Tests:** `pnpm test` (turbo, all packages).

## Status (as of 2026-06-09)

**Done + tested (90 tests green):**
- `packages/types`, `packages/shared` (20 tests), `packages/game-engine` (40 tests) — solid.
- `auth-service` — Argon2id, hashed refresh tokens, OWASP refresh-rotation +
  reuse detection, helmet/CORS/validation, pinned JWT alg. Builds + 9 tests.
- `market-service` — live ingestion pipeline (poll→cache→persist→publish→ws).
  Builds + 6 tests.
- `trading-service` — **order engine implemented**: atomic market fills, resting
  limit orders matched on ticks, weighted-avg cost basis, realized PnL, ledger
  writes under row locks, publishes `order.filled`/`trade.executed`. Builds + 9 tests.
- `portfolio-service` — read model (mark-to-market, PnL%, unrealized PnL,
  win-rate stats). Builds + 6 tests. **trading-service is the single writer**;
  portfolio reads the shared tables (no double-settle). `realized_pnl` is
  persisted on sell fills.
- `apps/web` — 12 routes, themed (forest/lime/gold), animated, PWA, **mock data**.

**Scaffolded but NOT yet hardened/tested:** `league`, `social`, `nft`,
`education`, `notification` services. They need the per-service fix pattern
(below) + real implementations + tests.

**Not started:** API gateway/BFF, web↔backend live wiring, seed demo user,
full `pnpm build`/`typecheck`/CI green.

## Conventions (follow these — they're load-bearing)

- **Money is never a JS `number`.** Use `decimal` from `@simcoin/shared`
  (fixed-point string math). Assert with `decimal.eq(...)` in tests.
- **DB tables are keyed on `symbol`** (text, FK to `markets.symbol`), NOT a
  market_id UUID. The domain types use `symbol`; the schema was reconciled to match.
- **Parameterized SQL only** — never string interpolation. Multi-step writes go
  through `DatabaseService.tx()` with `FOR UPDATE` row locks.
- **Per-service build-fix pattern** (apply when bringing a NestJS service green):
  - `import { Redis } from 'ioredis'` (named, not default)
  - add `@types/pg` (and `@types/express` if the controller imports `express`)
  - `NestFactory.create<NestExpressApplication>(...)` so `app.set('trust proxy')` types
  - type the pub/sub handler: `.on('message', (ch: string, message: string) => ...)`
  - jest config: ts-jest **CJS** preset + map `@simcoin/*` → `src` (copy
    `services/trading-service/jest.config.cjs`); add `--passWithNoTests` only
    until real specs exist.
- **Source of truth = `packages/types`.** Schema and services conform to it.
- **Events** (Redis pub/sub) are the only cross-service coupling — see
  `packages/types/src/events.ts` (`order.filled`, `trade.executed`,
  `achievement.unlocked`, `season.rolled`, `price.tick`, `user.registered`).

## Git workflow

- `develop` is the default branch and currently the ONLY branch — it holds the
  full project. Old legacy Kirki branches were deleted.
- Work on a `claude/simcoin-<topic>` branch, then fast-forward/merge into
  `develop`. Don't force-push `develop`.

## Next up (priority order) — the "live trading loop"

The headline goal: make the web app execute **real** trades end-to-end (today the
UI is mock data). Critical path:
1. **portfolio-service** — mark-to-market totals, realized/unrealized PnL, win
   rate, stats; subscribe to `trade.executed`; tests.
2. **league-service** — Redis sorted-set leaderboards + snapshots, season CRUD,
   tier promotion/relegation, season-roll job; tests.
3. **API gateway / BFF** — single entry, verifies JWT, injects `x-user-id`,
   routes to services; CORS + rate limits.
4. **Wire `apps/web`** — real auth (register/login/refresh), live dashboard
   (portfolio + positions + PnL + WS price ticks), trade flow, leaderboard.
5. **Seed a demo user** + sample portfolio so it's instantly playable.
6. **Get CI green** (`.github/workflows/ci.yml`: lint, typecheck, build, test).

Then the growth/engagement features (streaks, rivals, shareable trade cards,
guilds — see chat history / `docs/game-design/`).

## Useful pointers

- `docs/build-backlog.md` — running checklist + session log (update it).
- `docs/roadmap.md`, `docs/architecture/` — the plan and the why.
- `docs/research/invstr-competitive-analysis.md` — competitor teardown.
