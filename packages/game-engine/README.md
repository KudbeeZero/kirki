# @simcoin/game-engine

Pure, IO-free game logic. Every function is deterministic given its arguments —
no timers, no network, no database. The only dependency is
[`@simcoin/types`](../types) (plus `vitest` as a dev dependency for tests).

## Modules

- `xp` — quadratic XP curve. `levelFromXp(xp)`, `xpForLevel(level)`,
  `levelProgress(xp)`.
- `league` — five tiers (bronze → master) with per-tier promote/relegate
  thresholds. `evaluatePromotion(tier, percentile)`, `applyAction`,
  `rankToPercentile`.
- `season` — 30-day cadence schedule. `nextResetDate(start, now)`,
  `seasonIndex`, `msUntilReset`, `currentSeasonWindow`. Callers pass `now` so the
  module stays clock-free.
- `pnl` — `pnlPct(start, current)` and `positionPnlPct`. PnL % is a display/
  ranking ratio (a `number`), not a money balance.
- `achievements` — evaluate the DB `criteria` JSON against a stats object:
  `evaluateCriteria(criterion, stats)`, `criteriaProgress`, `parseCriteria`.

## Achievement criteria

Matches the JSON shape seeded in `database/seeds/01_reference.sql`:

```ts
import { evaluateCriteria, parseCriteria } from '@simcoin/game-engine';

const firstTrade = parseCriteria('{"type":"trade_count","gte":1}');
evaluateCriteria(firstTrade, { trade_count: 1 }); // true
```

Supports comparators `gte`/`lte`/`gt`/`lt`/`eq` and composite `all`/`any`
groups. Evaluation is fail-closed: unknown metrics yield `false`, never throws.

## Tests

```sh
pnpm --filter @simcoin/game-engine test
```

`src/achievements.spec.ts` covers the evaluator; `src/league.spec.ts` covers
promotion/relegation. Spec files are excluded from the `tsc` build.
