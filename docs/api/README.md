# API conventions

The Simcoin public API is REST + WebSocket. Clients talk to a single **API gateway** that
routes to the nine backend services (see [architecture](../architecture/README.md)); apps
never address services by their internal ports directly. Domain shapes (request bodies and
responses) come from [`@simcoin/types`](../../packages/types/src) so the wire format never
drifts from the database or UI.

## Base URL

| Environment | Base URL |
|-------------|----------|
| Local dev | `http://localhost:3000/api` (gateway; services run on `:4001`–`:4009`) |
| Production | `https://api.simcoin.app` (Railway services behind the gateway; web on Cloudflare) |

WebSocket: `wss://api.simcoin.app/ws` (local: `ws://localhost:3000/ws`). The socket
carries `PriceTickEvent`, `TradeExecutedEvent`/`OrderFilledEvent`, and
`AchievementUnlockedEvent` for the authenticated player.

## Versioning

The API is versioned by URL prefix: `/api/v1/...`. The current version is **v1**. Breaking
changes ship under a new prefix; additive changes (new optional fields, new endpoints) do
not bump the version. Paths in the per-domain docs omit the `/api/v1` prefix for brevity.

## Authentication

Auth is a **short-lived bearer access token** plus an **httpOnly refresh cookie**, issued
by `auth-service` (see [auth.md](auth.md) and
[`services/auth-service/README.md`](../../services/auth-service/README.md)).

- **Access token** — a JWT (`AccessTokenClaims`: `sub`, `role`, `sid`, `mfa`, `iat`,
  `exp`), lifetime **15 minutes**. Sent as `Authorization: Bearer <accessToken>`. Held in
  memory by the client, **never** in `localStorage`. Authenticates REST calls and the
  WebSocket handshake.
- **Refresh token** — opaque, stored server-side only as a SHA-256 hash. Delivered in an
  `HttpOnly; Secure; SameSite=strict` cookie scoped to `/auth`. `POST /auth/refresh`
  rotates it (one-time use); presenting a rotated token revokes the whole session family.

Endpoints are marked **public**, **bearer** (requires a valid access token), or **cookie**
(requires the refresh cookie). RBAC roles (`player`/`creator`/`moderator`/`admin`) are
enforced by the gateway/`RolesGuard` from the token's `role` claim.

## Error envelope

Errors return a non-2xx status and a JSON envelope:

```json
{
  "error": {
    "code": "ORDER_REJECTED",
    "message": "Insufficient cash balance for this order.",
    "details": { "required": "1500.00", "available": "920.31" }
  }
}
```

| Field | Meaning |
|-------|---------|
| `error.code` | Stable, machine-readable identifier (SCREAMING_SNAKE_CASE) |
| `error.message` | Human-readable summary. Auth errors are intentionally **generic** (no user enumeration). |
| `error.details` | Optional structured context; field-level validation errors keyed by field |

Common status codes: `400` validation, `401` missing/invalid token, `403` role denied,
`404` not found, `409` conflict (e.g. duplicate handle), `422` business-rule rejection,
`429` rate-limited, `5xx` server.

## Pagination

List endpoints are cursor-paginated:

```
GET /portfolio/transactions?limit=50&cursor=<opaque>
```

```json
{
  "data": [ /* items */ ],
  "page": { "nextCursor": "eyJ0cyI6...", "hasMore": true, "limit": 50 }
}
```

`limit` defaults to 50, max 100. Omit `cursor` for the first page; pass `page.nextCursor`
to continue. Leaderboards use `LeaderboardPage` (offset by `rank`) and additionally return
the caller's own row in `me`.

## Rate limiting

Per-IP and per-account throttling protect every endpoint; auth endpoints are the
strictest. Limits surface as `429` with the error envelope and standard
`RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset` headers.

| Endpoint | Limit |
|----------|-------|
| `POST /auth/register` | 5 / hour / IP |
| `POST /auth/login` | 10 / min / IP (+ per-account lockout after 5 failures) |
| `POST /orders` | 60 / min / user |
| Other authenticated reads | 120 / min / user |

## Phase-1 endpoint map

The Phase-1 (MVP) surface across services. Per-domain contracts are linked below.

| Domain | Method | Path | Auth | Notes |
|--------|--------|------|------|-------|
| [Auth](auth.md) | POST | `/auth/register` | public | Email + password + handle |
| [Auth](auth.md) | POST | `/auth/login` | public | Access token + refresh cookie |
| [Auth](auth.md) | POST | `/auth/refresh` | cookie | Rotates refresh token |
| [Auth](auth.md) | POST | `/auth/logout` | bearer | Revokes current session |
| [Auth](auth.md) | GET | `/auth/me` | bearer | Current user / claims |
| [Market](market.md) | GET | `/markets` | public | Tradable universe |
| [Market](market.md) | GET | `/markets/:symbol` | public | One market + latest tick |
| [Market](market.md) | GET | `/markets/:symbol/candles` | public | OHLC candles |
| [Trading](trading.md) | POST | `/orders` | bearer | Place market/limit order |
| [Trading](trading.md) | GET | `/orders` | bearer | List own orders |
| [Trading](trading.md) | GET | `/orders/:id` | bearer | One order |
| [Trading](trading.md) | DELETE | `/orders/:id` | bearer | Cancel an open order |
| [Portfolio](portfolio.md) | GET | `/portfolio` | bearer | Cash, value, PnL % |
| [Portfolio](portfolio.md) | GET | `/portfolio/positions` | bearer | Open positions |
| [Portfolio](portfolio.md) | GET | `/portfolio/transactions` | bearer | Ledger (paginated) |
| [Portfolio](portfolio.md) | GET | `/portfolio/stats` | bearer | Win rate, best/worst |
| [Competition](competition.md) | GET | `/leaderboard` | bearer | Ranked standings |
| [Competition](competition.md) | GET | `/leagues/me` | bearer | Caller's tier/division |
| [Competition](competition.md) | GET | `/seasons/current` | public | Active season |
| Achievements | GET | `/achievements` | bearer | Catalogue + own progress |

> Decimal values (prices, quantities, balances, PnL) cross the wire as **strings**
> (`Decimal` in `@simcoin/types`) to avoid floating-point drift.
</content>
