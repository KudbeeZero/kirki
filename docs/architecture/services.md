# Service reference

Simcoin is nine NestJS microservices, one per bounded context. Services are decoupled by
contract: they never call each other's internals, only publish/consume **domain events**
from [`packages/types/src/events.ts`](../../packages/types/src/events.ts) over Redis
pub/sub (see [Modularity principle](README.md#modularity-principle)). Ports below are the
local-dev values from [`.env.example`](../../.env.example).

| Service | Port | Phase |
|---------|------|-------|
| [auth-service](#auth-service) | 4001 | P1 |
| [market-service](#market-service) | 4002 | P1 |
| [portfolio-service](#portfolio-service) | 4003 | P1 |
| [trading-service](#trading-service) | 4004 | P1 |
| [league-service](#league-service) | 4005 | P1 / P4 |
| [social-service](#social-service) | 4006 | P2 |
| [nft-service](#nft-service) | 4007 | P5 |
| [education-service](#education-service) | 4008 | P3 |
| [notification-service](#notification-service) | 4009 | P1 |

The `events.ts` channel map (`REDIS_CHANNELS`):

- `price.tick` → `simcoin:price:ticks`
- `trade.executed`, `order.filled` → `simcoin:trades`
- `achievement.unlocked` → `simcoin:achievements`
- `season.rolled` → `simcoin:seasons`

---

## auth-service

**Port:** 4001 · **Phase:** P1

**Responsibility.** The platform's front door: identity, sessions with refresh-token
rotation, OAuth (`google`/`x`), wallet-connect (`algorand`/`solana`/`icp`), MFA, RBAC,
and the tamper-evident security audit trail. See
[`services/auth-service/README.md`](../../services/auth-service/README.md) and the
separately-authored security model.

**Owned tables.** `users`, `auth_identities`, `wallets`, `sessions`,
`verification_tokens`, `mfa_factors`, `mfa_recovery_codes`, `security_audit_log`
(plus the `failed_login_count` / `locked_until` / `email_verified_at` / `last_login_at` /
`mfa_enabled` / `role` columns added to `users` in `02_auth_security.sql`).

**Key endpoints.** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /auth/me` (full contract in [api/auth.md](../api/auth.md)).

**Events published.** `user.registered` (`UserRegisteredEvent`) on `simcoin:seasons`'s
sibling — actually published to be consumed by portfolio/league bootstrap (no dedicated
channel constant; carried as a `DomainEvent`).

**Events consumed.** None in P1 (auth is upstream of everything).

---

## market-service

**Port:** 4002 · **Phase:** P1

**Responsibility.** Ingests real, live prices for the Phase-1 universe (BTC, ETH, SOL,
ALGO, ICP, DOGE) from the configured provider (`MARKET_DATA_PROVIDER=coingecko`, polled
every `MARKET_POLL_INTERVAL_MS`), caches the latest tick per symbol in Redis, persists the
durable time-series, and distributes ticks.

**Owned tables.** `markets`, `market_data` (durable price time-series; hot reads are served
from the Redis cache, not this table).

**Key endpoints.** `GET /markets`, `GET /markets/:symbol`, `GET /markets/:symbol/candles`
(see [api/market.md](../api/market.md)).

**Events published.** `price.tick` (`PriceTickEvent`) → `simcoin:price:ticks`.

**Events consumed.** None.

---

## portfolio-service

**Port:** 4003 · **Phase:** P1

**Responsibility.** Owns each player's simulated account: cash balance, positions,
mark-to-market valuation, realised/unrealised PnL, and the immutable transaction ledger.
Recomputes portfolio value as prices tick and as fills land.

**Owned tables.** `portfolios`, `positions`, `transactions`.

**Key endpoints.** `GET /portfolio`, `GET /portfolio/positions`,
`GET /portfolio/transactions`, `GET /portfolio/stats` (see
[api/portfolio.md](../api/portfolio.md)).

**Events published.** None directly (mutations are driven by consumed events). May emit
`achievement.unlocked` when a portfolio milestone (e.g. `double_up`) is met.

**Events consumed.**
- `order.filled` / `trade.executed` (`simcoin:trades`) — applies the fill: updates
  `positions`, `portfolios.cash_balance`, and appends `transactions` rows.
- `price.tick` (`simcoin:price:ticks`) — refreshes mark-to-market value and `pnlPct`.
- `season.rolled` (`simcoin:seasons`) — creates a fresh, season-scoped portfolio.

---

## trading-service

**Port:** 4004 · **Phase:** P1

**Responsibility.** The paper-trading engine. Validates and matches orders (`market` and
`limit`), produces fills, and records order state. Market orders fill against the latest
cached price from market-service; open limit orders rest and fill when ticks cross.

**Owned tables.** `orders` (writes `transactions` indirectly via the portfolio's fill
handling; `transactions.order_id` references back here).

**Key endpoints.** `POST /orders`, `GET /orders`, `GET /orders/:id`,
`DELETE /orders/:id` (cancel) (see [api/trading.md](../api/trading.md)).

**Events published.**
- `order.filled` (`OrderFilledEvent`) → `simcoin:trades`.
- `trade.executed` (`TradeExecutedEvent`, extends `OrderFilledEvent` with `realizedPnl`
  and `tradeCount`) → `simcoin:trades`.

**Events consumed.**
- `price.tick` (`simcoin:price:ticks`) — drives resting limit-order matching.

---

## league-service

**Port:** 4005 · **Phase:** P1 (leagues/leaderboards) / P4 (season scheduler)

**Responsibility.** Ranks, leaderboards, league tiers/divisions, and the season lifecycle:
the season scheduler, promotion/relegation at season end, and standings persistence. Live
ranking is maintained in Redis sorted sets keyed by PnL %; snapshots are persisted for
history.

**Owned tables.** `seasons`, `leagues`, `leaderboards`.

**Key endpoints.** `GET /leaderboard`, `GET /leagues/me`, `GET /seasons/current`,
`GET /seasons` (see [api/competition.md](../api/competition.md)).

**Events published.** `season.rolled` (`SeasonRolledEvent`) → `simcoin:seasons`.

**Events consumed.**
- `trade.executed` (`simcoin:trades`) — updates the player's live leaderboard score.
- `price.tick` (`simcoin:price:ticks`) — refreshes scores as portfolio values move.

---

## social-service

**Port:** 4006 · **Phase:** P2

**Responsibility.** Friends, public profiles, following, the trade feed, comments, likes,
and guilds. Turns solo trading into a social graph.

**Owned tables.** `friends`, `posts`, `comments`.

**Key endpoints.** Profile, friend, feed, comment, and like endpoints (P2 — not in the
Phase-1 API surface).

**Events published.** None in the core contract.

**Events consumed.**
- `trade.executed` (`simcoin:trades`) — can auto-generate "I just traded" feed cards
  linking a `transactions` row via `posts.trade_ref`.

---

## nft-service

**Port:** 4007 · **Phase:** P5

**Responsibility.** Progressive tokenization of achievements/cosmetics. Advances `nfts`
through the `nft_stage` enum (`db_badge` → `nft_badge` → `cosmetic` → `marketplace`) and
mints via the `ChainMinter` adapter abstraction over `algorand`/`solana`/`icp`. Never a
prerequisite to play. See [tokenomics/nft-roadmap.md](../tokenomics/nft-roadmap.md).

**Owned tables.** `nfts` (uses `wallets` from auth at mint time).

**Key endpoints.** Mint, list, and (later) marketplace endpoints (P5).

**Events published.** None in the core contract.

**Events consumed.**
- `achievement.unlocked` (`simcoin:achievements`) — records the earned achievement as a
  `db_badge` `nfts` row, eligible for later optional minting.

---

## education-service

**Port:** 4008 · **Phase:** P3

**Responsibility.** The "Duolingo" layer: lesson modules (Fundamentals, Technical
Analysis, Strategy, Advanced), the lesson player, quizzes, per-lesson XP, badges, and
certificates. Credits `users.xp`. See
[game-design/education.md](../game-design/education.md).

**Owned tables.** `lessons`, `lesson_progress` (writes `users.xp`).

**Key endpoints.** Lesson catalogue, lesson detail, progress submission (P3).

**Events published.** `achievement.unlocked` (`simcoin:achievements`) when a lesson/module
completion grants a badge.

**Events consumed.** None in the core contract.

---

## notification-service

**Port:** 4009 · **Phase:** P1

**Responsibility.** Email, push, and in-app notifications. Fans relevant domain events out
to players (fill confirmations, achievement unlocks, season results).

**Owned tables.** None (consumes events; delivery state is service-local).

**Key endpoints.** In-app notification list / mark-read (internal).

**Events published.** None.

**Events consumed.**
- `trade.executed` / `order.filled` (`simcoin:trades`) — fill confirmations.
- `achievement.unlocked` (`simcoin:achievements`) — unlock celebrations.
- `season.rolled` (`simcoin:seasons`) — end-of-season summaries.
</content>
</invoke>
