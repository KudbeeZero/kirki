# Competition API

Leaderboards, leagues, and seasons, served by `league-service` (`:4005`, P1 leaderboards /
P4 season scheduler). Conventions in the [API README](README.md); types from
[`@simcoin/types` · `competition.ts`](../../packages/types/src/competition.ts).

Live ranking is maintained in Redis sorted sets keyed by PnL %; snapshots persist to
`leaderboards`. Tier and division rules are in
[game-design/leagues.md](../game-design/leagues.md); the season lifecycle is in
[game-design/seasons.md](../game-design/seasons.md).

---

## GET /leaderboard

Bearer. Ranked standings for a scope/period, plus the caller's own row.

**Query params**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `scope` | `LeaderboardScope` | `season` | `daily`\|`weekly`\|`monthly`\|`all_time`\|`season` |
| `periodKey` | string | current | e.g. `2026-06-09`, `2026-W23`; defaults to the live period |
| `tier` | `LeagueTierName`? | — | Filter to one tier's board |
| `limit` | int | 50 | Page size (cap 100) |
| `offset` | int | 0 | By rank |

**Response** `200` — `LeaderboardPage`

```json
{
  "scope": "season", "periodKey": "season-1",
  "entries": [
    { "rank": 1, "userId": "…", "handle": "satoshi", "avatarUrl": null, "score": "38.42", "tier": "master" },
    { "rank": 2, "userId": "…", "handle": "ada", "avatarUrl": null, "score": "31.10", "tier": "diamond" }
  ],
  "me": { "rank": 287, "userId": "…", "handle": "you", "avatarUrl": null, "score": "4.31", "tier": "silver" },
  "total": 12044
}
```

`score` is portfolio value / PnL %. `me` is always included even if outside the page.

---

## GET /leagues/me

Bearer. The caller's league membership for the active season.

**Response** `200` — `LeagueMembership`

```json
{ "seasonId": "…", "userId": "…", "tier": "silver", "division": 3, "promoted": null }
```

`tier` ∈ `bronze`/`silver`/`gold`/`diamond`/`master`; `division` is the sub-group within
the tier; `promoted` is `null` mid-season and set to `true`/`false` at the season roll.

---

## GET /seasons/current

Public. The active season (one at a time, per `one_active_season_idx`).

**Response** `200` — `Season`

```json
{
  "id": "…", "name": "Season 1",
  "startsAt": "2026-06-01T00:00:00Z", "endsAt": "2026-07-01T00:00:00Z",
  "startingCash": "100000.00000000", "isActive": true
}
```

---

## GET /seasons

Public. Season history (paginated), most recent first.

**Response** `200` — `{ data: Season[]; page: {...} }`.

---

## GET /achievements

Bearer. The achievement catalogue with the caller's progress (served alongside
competition data; catalogue defined in
[game-design/achievements.md](../game-design/achievements.md)).

**Response** `200` — `UserAchievement[]`

```json
[
  {
    "achievement": { "id": "…", "code": "first_trade", "name": "First Trade", "description": "Place your very first order.", "icon": null, "xpReward": 50 },
    "status": "unlocked", "progress": 1, "unlockedAt": "2026-06-09T12:00:01Z"
  },
  {
    "achievement": { "id": "…", "code": "hundred_trades", "name": "Centurion", "description": "Place 100 trades.", "icon": null, "xpReward": 300 },
    "status": "in_progress", "progress": 0.42, "unlockedAt": null
  }
]
```

`status` ∈ `locked`/`in_progress`/`unlocked`; `progress` is 0..1.
</content>
