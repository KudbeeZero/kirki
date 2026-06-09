# Simcoin

**Duolingo for crypto trading.** Simcoin is a fantasy cryptocurrency trading platform
with educational gamification — learn how markets work by trading simulated assets
against real, live price feeds, climb competitive leagues, and earn achievements.
No real money. No real risk.

> Think: **Fantasy Football + TradingView + Duolingo + Clash Royale Seasons.**

Players start with simulated money, trade simulated assets against real prices, compete
in 30-day seasons, climb rank leagues, unlock cosmetics, learn crypto concepts, and
collect achievements.

> ### ▶️ Want to run it? See **[QUICKSTART.md](./QUICKSTART.md)** — the web app is
> two commands (`pnpm install` then `pnpm --filter @simcoin/web dev`) and needs no
> database.

---

## What's in this repository

This is a **monorepo** containing every app, service, and shared package for Simcoin.

```
simcoin/
├── apps/                 # User-facing applications
│   ├── web/              # Next.js 15 web app (primary client)
│   ├── mobile/           # Mobile app (Expo / React Native) — Phase 2
│   └── admin/            # Internal admin / operations console
├── services/             # Backend microservices (NestJS)
│   ├── auth-service/         # Identity, sessions, OAuth, wallet connect
│   ├── market-service/       # Real-time price ingestion & distribution
│   ├── portfolio-service/    # Holdings, positions, PnL, history
│   ├── trading-service/      # Order matching for the paper-trading engine
│   ├── league-service/       # Ranks, leaderboards, seasons
│   ├── social-service/       # Friends, profiles, feed, guilds — Phase 2
│   ├── nft-service/          # Achievement/cosmetic tokenization — Phase 5
│   ├── education-service/    # Lessons, progress, certificates — Phase 3
│   └── notification-service/ # Email/push/in-app notifications
├── packages/             # Shared, versioned internal libraries
│   ├── types/            # Canonical domain types (source of truth)
│   ├── sdk/              # Typed client SDK for the public API
│   ├── ui/               # Shared React components (ShadCN-based)
│   ├── game-engine/      # Pure game logic: ranks, XP, season math
│   └── shared/           # Cross-cutting utils, config, logging, errors
├── blockchain/           # Pluggable chain adapters (added later, never required)
│   ├── algorand/
│   ├── solana/
│   └── icp/
├── database/             # Schema, migrations, seeds
│   ├── schemas/          # Canonical SQL schema (documentation + source)
│   ├── migrations/       # Forward-only migration files
│   └── seeds/            # Reference + demo data
└── docs/                 # Architecture, API, game design, tokenomics
    ├── architecture/
    ├── api/
    ├── game-design/
    └── tokenomics/
```

## Product principles

1. **No real-money trading required.** Crypto, wallets, and NFTs are *optional expansions*,
   never prerequisites to play.
2. **Modular by phase.** The trading simulator, leaderboards, education, and seasons are
   the core product. Everything else ships as an independent module behind a stable
   interface, so it can be enabled or deferred without refactoring.
3. **Real data, simulated stakes.** Prices are real and live; balances are fake.
4. **Mobile-first.** The web app is responsive-first; a dedicated mobile client follows.

## Release roadmap

| Phase | Theme | Headline features |
|-------|-------|-------------------|
| **1** | MVP (45–60 days) | Auth, live market engine, paper trading, portfolio/PnL, leaderboards, rank leagues, DB achievements |
| **2** | Social | Friends, profiles, following, trade feed, comments, likes, guilds |
| **3** | Education | Lesson modules, XP, badges, certificates |
| **4** | Seasons | 30-day resets, rewards, trophies, recurring challenges (the retention engine) |
| **5** | NFT layer | DB achievements → NFT badges → tradable cosmetics → marketplace |
| **6** | Creator economy | Player-made challenges, tournaments, leagues, courses w/ revenue share |

See [`docs/roadmap.md`](docs/roadmap.md) for the detailed breakdown.

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind, ShadCN, Framer Motion
- **Backend:** NestJS, TypeScript
- **Data:** PostgreSQL (system of record), Redis (cache, pub/sub, leaderboards)
- **Realtime:** WebSockets
- **Auth:** Better Auth
- **Tooling:** pnpm workspaces + Turborepo
- **Hosting:** Cloudflare (edge/web), Railway (services + data)
- **Analytics:** PostHog

## Getting started

> Requires Node ≥ 20, pnpm ≥ 9, and Docker.

```bash
pnpm install                 # install all workspace deps
cp .env.example .env         # configure local secrets
docker compose up -d         # start Postgres + Redis
pnpm db:migrate              # apply database migrations
pnpm dev                     # run apps + services in watch mode
```

See [`docs/architecture/README.md`](docs/architecture/README.md) for the system overview
and [`docs/api/README.md`](docs/api/README.md) for API contracts.

## License

MIT © Simcoin. See [LICENSE](LICENSE).
