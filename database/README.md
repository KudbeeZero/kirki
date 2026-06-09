# Database

PostgreSQL 16 is Simcoin's system of record. Redis handles hot reads
(live prices, leaderboard sorted-sets, session cache, pub/sub).

## Layout

| Path | Purpose |
|------|---------|
| `schemas/` | Canonical, documented DDL. Mounted into the local Postgres container as init scripts (run in filename order). Treat as the source-of-truth reference. |
| `migrations/` | Forward-only migration files (`NNNN_name.sql`), applied in order. Production schema changes go here. |
| `seeds/` | Reference data (markets, season, achievements, lessons) and demo data. |
| `migrate.mjs` | Tiny runner used by `pnpm db:migrate` / `pnpm db:seed`. |

## Tables at a glance

- **Identity:** `users`, `auth_identities`, `wallets`
- **Auth/security:** `sessions`, `verification_tokens`, `mfa_factors`, `mfa_recovery_codes`, `security_audit_log`
- **Markets:** `markets`, `market_data`
- **Trading:** `portfolios`, `positions`, `orders`, `transactions`
- **Competition:** `seasons`, `leagues`, `leaderboards`
- **Achievements/NFT:** `achievements`, `user_achievements`, `nfts`
- **Social:** `friends`, `posts`, `comments`
- **Education:** `lessons`, `lesson_progress`

## Local usage

```bash
docker compose up -d        # schemas/ auto-applied on first boot
pnpm db:migrate             # apply any pending migrations
pnpm db:seed                # load reference data
```
