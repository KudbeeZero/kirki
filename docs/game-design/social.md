# Social & Competition Design

How Simcoin turns solo paper-trading into a social game. Derived from the
competitive research in [`docs/research/invstr-competitive-analysis.md`](../research/invstr-competitive-analysis.md)
and adapted to be **crypto-native** and **mobile-first**. Backed by
`social-service` (Phase 2), `league-service` (Phase 1/4), and the
`friends`/`posts`/`comments` tables.

## Design thesis

Adopt the mechanics that demonstrably retain users, and **avoid the two traps
that hurt Invstr and Public.com**:

- ❌ **No hard daily trade caps** behind a paywall (Invstr's #1 complaint).
- ❌ **No generic vanity activity feed** (Public.com killed theirs). Our social
  surface is **actionable**: shareable trade ideas, head-to-head leagues, and
  sentiment — things that change what you do, not just what you scroll.

## 1. Leagues & seasons (Phase 1 core, Phase 4 expansion)

Better than Invstr's behavior-gated Raw/Supreme/Xtreme tiers: a **skill-based
ladder** with promotion/relegation, so you always compete near your level.

- **Tiers:** Bronze → Silver → Gold → Diamond → Master (`league_tier` enum).
- **Divisions** within a tier group ~30 players for a winnable race.
- **Scoring:** season PnL % (fair across portfolio sizes).
- **Season cadence:** 30-day reset. **Portfolios reset; XP, achievements, and
  trophies persist** (see [`seasons.md`](seasons.md)).
- **Promotion/relegation:** top X% promote, bottom Y% relegate at season roll
  (`packages/game-engine` computes bands).

## 2. Contest formats (combat fatigue — proven by MarketDraft/Altcoin Fantasy)

Beyond the always-on season ladder, run rotating short contests:

| Format | Mechanic | Inspiration |
|--------|----------|-------------|
| **Weekly Sprint** | Mon→Fri, **lock your picks, no swaps** — ride the leaderboard | LARP |
| **Streak** | Predict each day's up/down; longest streak wins | MarketDraft |
| **Live Race** | First to a target portfolio value, real-time | MarketDraft |
| **Team Cup** | Guilds compete; aggregate member PnL | Exchange tournaments |

The "lock picks / no swaps" constraint is cheap to build and manufactures genuine
leaderboard suspense.

## 3. Private leagues (viral loop — Phase 2)

- Any user creates an **invite-only league** with custom rules (duration, asset
  whitelist, starting cash) and shares a join link/code.
- Built for **friends, classrooms, and clubs** — the school-edition wedge.
- Drives social-accountability retention and organic acquisition.

## 4. Social graph & feed (Phase 2 — *actionable*, not vanity)

- **Follow** other traders; profiles show verified track record (season history,
  win rate, current tier) — transparency like eToro's Popular Investor profiles.
- **Trade ideas / picks**: users publish a thesis attached to a position
  (`posts.trade_ref` → a transaction). Others **like, comment, and "tail"** it.
- **Sentiment**: aggregate bullish/bearish per asset (Stocktwits-style) — surfaced
  on the market screen, where it's actionable.
- **Guilds**: persistent groups with a shared feed and Team Cup entry.

## 5. Copy / "tail" trades (Phase 2 → creator economy Phase 6)

- **Tail a trade:** mirror a single shared position (safe, opt-in) — adapts
  Invstr's one-tap copy without claiming full auto copy-trading.
- **Copy a portfolio** (later): opt-in mirroring of a top trader's allocation,
  gated behind track-record + transparency requirements (eToro model).
- **Creator economy (Phase 6):** top creators earn revenue share from
  subscriptions/tails; require a posting cadence + verified performance to qualify
  (eToro's flywheel) — see [`docs/tokenomics/nft-roadmap.md`](../tokenomics/nft-roadmap.md)
  for reward rails.

## 6. Progression & rewards

- **XP + levels** from trading, learning, and competing (`users.xp`,
  `packages/game-engine/xp`). Avoid Invstr's confusing tier-name sprawl — one
  clean level curve + named milestones.
- **Achievements** (`achievements` / `user_achievements`) → DB badges now,
  optional **NFT badges** later (never required).
- **Trophies** for season finishes; **streaks** for daily engagement (Invstr
  never confirmed having these — easy differentiator).
- **Prizes that bridge to value:** season winners earn cosmetics, trophies, and
  (later, where legal) real-crypto or partner rewards — Invstr's conversion funnel
  without the defunct brokerage dependency.

## 7. Anti-pattern guardrails (write these into product reviews)

1. Never gate core trading volume behind a paywall.
2. Keep social actionable; kill any feature that's pure vanity scroll.
3. Don't over-monetize gamification (no pay-to-win multipliers that distort
   leaderboards — a fairness + integrity issue, see `docs/architecture/security.md` §10).
4. Invest in charting/analytics depth so graduating users don't churn.

## Phasing

| Phase | Social/competition scope |
|-------|--------------------------|
| **P1** | League tiers, global + periodic leaderboards, seasons, achievements (DB) |
| **P2** | Follow graph, profiles, trade-idea feed, comments/likes, guilds, private leagues, tail-a-trade, sentiment |
| **P4** | Season rewards/trophies, rotating contest formats, Team Cups |
| **P6** | Creator economy: portfolio copy, subscriptions, revenue share |
