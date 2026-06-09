# Trading API

The paper-trading engine, served by `trading-service` (`:4004`, P1). Conventions in the
[API README](README.md); types from
[`@simcoin/types` · `trading.ts`](../../packages/types/src/trading.ts).

Orders are placed against the caller's active (season-scoped) portfolio. Market orders
fill against the latest cached price; limit orders rest until a tick crosses
`limitPrice`. Fills publish `order.filled` and `trade.executed` on `simcoin:trades`, which
`portfolio-service` and `league-service` consume (see
[data-flow (b)](../architecture/data-flow.md#b-place-a-market-order--fill--portfolio-update--achievement-check)).
All endpoints are **bearer**-authenticated.

---

## POST /orders

Place an order. Rate-limited **60 / min / user**.

**Request** — `PlaceOrderRequest`

```json
{ "symbol": "BTC", "side": "buy", "type": "market", "notional": "1000.00" }
```

| Field | Type | Notes |
|-------|------|-------|
| `symbol` | string | e.g. `BTC` |
| `side` | `buy` \| `sell` (`OrderSide`) | |
| `type` | `market` \| `limit` (`OrderType`) | |
| `quantity` | `Decimal`? | Asset quantity. Mutually exclusive with `notional` |
| `notional` | `Decimal`? | USD to spend/receive; the engine derives `quantity` |
| `limitPrice` | `Decimal`? | Required for `limit`; null/omitted for `market` |

**Response** `201` — `Order`

```json
{
  "id": "…", "portfolioId": "…", "symbol": "BTC", "side": "buy", "type": "market",
  "status": "filled", "quantity": "0.01486000", "limitPrice": null,
  "filledQty": "0.01486000", "avgFillPrice": "67250.42000000",
  "createdAt": "2026-06-09T12:00:01Z", "updatedAt": "2026-06-09T12:00:01Z"
}
```

A market order returns `filled` (or `partially_filled`); a limit order returns `open`
until matched. `OrderStatus` ∈ `open`/`filled`/`partially_filled`/`cancelled`/`rejected`.

| Error | When |
|-------|------|
| `422 ORDER_REJECTED` | Insufficient cash (buy) or position (sell); `details` includes required/available |
| `400 VALIDATION` | Both/neither of `quantity`/`notional`; missing `limitPrice` on a limit order |
| `404 MARKET_NOT_FOUND` | Unknown `symbol` |

---

## GET /orders

List the caller's orders (paginated; see [pagination](README.md#pagination)).

**Query params** — `status?` (`OrderStatus`), `symbol?`, `limit?`, `cursor?`.

**Response** `200` — `{ data: Order[]; page: {...} }`, newest first
(`orders_portfolio_idx`).

---

## GET /orders/:id

Fetch one order owned by the caller.

**Response** `200` — `Order`.

| Error | When |
|-------|------|
| `404 ORDER_NOT_FOUND` | Unknown id or not owned by caller |

---

## DELETE /orders/:id

Cancel an **open** order (a resting limit order). Sets `status = cancelled`.

**Response** `200` — `Order` (with `status: "cancelled"`).

| Error | When |
|-------|------|
| `404 ORDER_NOT_FOUND` | Unknown / not owned |
| `409 NOT_CANCELLABLE` | Already `filled`/`cancelled`/`rejected` |
</content>
