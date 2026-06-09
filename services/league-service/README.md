# league-service

Competition for Simcoin: ranks, leaderboards, seasons, and league tiers.

- **Leaderboards** are live in Redis **sorted sets** (`leaderboard:<scope>:<period>`)
  for O(log n) score upserts and ranked range reads; the relational
  `leaderboards` table is the durable snapshot taken at each season roll.
- **Seasons** run 30 days. A scheduled job rolls the season at the boundary.
- **Tiers** run bronze → silver → gold → diamond → master, with
  promotion/relegation bands applied at each roll.

## Endpoints (Phase 1)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/leaderboards/:scope` | `scope` ∈ daily, weekly, monthly, all_time, season. Includes caller's "me" row. |
| `GET` | `/seasons/current` | The active season. |
| `GET` | `/leagues/me` | Caller's tier + division this season. |

The caller's user id arrives as `x-user-id` from the API gateway.

## Scheduled work

`SeasonRollJob` runs daily at midnight UTC and rolls the season once the active
one has expired (snapshot → promote/relegate → open next → publish
`season.rolled`). Running daily keeps it resilient to restarts and clock drift.

## Run locally

```bash
pnpm --filter @simcoin/league-service dev    # watch mode on :4005
pnpm --filter @simcoin/league-service test   # unit tests
```
