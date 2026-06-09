# Build Backlog

Prioritized queue for the hourly build sessions. Each session: pick the
**highest-priority unchecked item**, implement it fully (real code + tests where
possible), check it off with a one-line note, then commit & push.

> Constraint: if `pnpm install` is unavailable in the session, still write the
> code; mark the item `[~]` (code written, not yet verified) instead of `[x]`.

## Phase 1 — MVP (the core product)

- [x] **Verify toolchain** — `pnpm install` works (network available). Fixed cross-package resolution (path aliases → built `dist` declarations; dropped `composite`). `@simcoin/types`, `shared`, `game-engine` build clean. **game-engine 19 tests + auth-service 9 tests green** (incl. Argon2 + session reuse-detection). Fixed: argon2.verify options, `@types/pg`, ts-jest→CJS config. Remaining services/apps build in later iterations.
- [x] **packages/shared** — `decimal` (bigint money math) + `redis` facade now covered by **20 unit tests** (no float drift, half-up rounding, div-by-zero, WITHSCORES leaderboard parsing). Added vitest + spec exclusion from build.
- [x] **packages/game-engine** — all 5 modules (xp/league/season/pnl/achievements) implemented and **fully tested: 40 tests** (added xp 7, pnl 6, season 8). Pure, zero-dep.
- [ ] **market-service** — runnable CoinGecko ingestion loop → Redis cache → `market_data` persistence → `price.tick` publish → WS gateway. Add a fake provider for tests.
- [ ] **trading-service** — order engine: validate vs cash/holdings, market fill at live price, limit matching on ticks, write `orders`+`transactions`, publish `order.filled`/`trade.executed`. Unit tests for fill math.
- [ ] **portfolio-service** — mark-to-market totals, realized/unrealized PnL, win rate, stats; subscribe to `trade.executed`. Tests.
- [ ] **league-service** — Redis sorted-set leaderboards + `leaderboards` snapshots, season CRUD, tier promotion/relegation; season-roll job. Tests.
- [ ] **achievements wiring** — evaluate criteria on `trade.executed`, unlock + award XP, publish `achievement.unlocked`.
- [ ] **API gateway / BFF** — single entry that authenticates (verifies JWT), injects `x-user-id`, and routes to services; wire CORS + rate limits.
- [ ] **apps/web auth** — end-to-end register/login/refresh/logout against auth-service; protected routes; in-memory access token.
- [ ] **apps/web dashboard** — live portfolio + positions + PnL from services; live price ticks over WS.
- [ ] **apps/web trade flow** — place market/limit orders, see fills, order history.
- [ ] **apps/web leaderboard + leagues** — live standings, tier, season countdown.
- [ ] **notification-service** — in-app notifications on fills/achievements; web delivery.
- [ ] **education-service + learn UI** — lesson list/detail, complete → XP/progress.
- [ ] **Design system** — apply brand (dark-green + gold theme, logo) from `docs/design/` to `@simcoin/ui` + web; mobile-first polish.
- [ ] **Seed + demo** — seed markets/season/achievements/lessons; a demo user + sample portfolio.
- [ ] **CI green** — ensure `.github/workflows/ci.yml` passes (lint, typecheck, build, test).

## Phase 2+ (after MVP is solid)
- [ ] Social graph (follow, profiles, trade-idea feed, comments/likes), guilds, private leagues — see `docs/game-design/social.md`.
- [ ] Contest formats (Weekly Sprint w/ locked picks, Streak, Live Race, Team Cup).
- [ ] Education modules content; certificates.
- [ ] NFT badges (opt-in) via `ChainMinter`.

## Session log
<!-- Each hourly run appends: YYYY-MM-DD HH:MM — <item> — <result/commit> -->
- 2026-06-09 07:36 — Verify toolchain — install OK; monorepo build wiring fixed; types/shared/game-engine green; 28 tests passing (game-engine 19, auth 9).
- 2026-06-09 08:36 — packages/shared tests — decimal + redis facade, 20 tests green; build clean.
- 2026-06-09 09:28 — game-engine coverage — xp/pnl/season specs added; 40 tests green (full module coverage).
