# @simcoin/sdk

Typed client SDK for the Simcoin public API. Consumed by `apps/web`,
`apps/mobile`, and `apps/admin`. Every request and response shape comes from
[`@simcoin/types`](../types), so the client can never drift from the server.

## Usage

```ts
import { SimcoinClient, MemoryTokenProvider } from '@simcoin/sdk';

const client = new SimcoinClient({
  baseUrl: 'https://api.simcoin.app',
  tokenProvider: new MemoryTokenProvider(),
});

await client.auth.login({ email: 'a@b.com', password: 'hunter2' });

const markets = await client.markets.list();
const order = await client.trading.placeOrder({
  symbol: 'BTC',
  side: 'buy',
  type: 'market',
  notional: '500',
});
const top = await client.leaderboards.page('weekly', { limit: 25 });
```

## Namespaces

- `auth` — `register`, `login`, `refresh`, `logout`, `me`
- `markets` — `list`, `get`, `price`, `candles`
- `portfolio` — `get`, `positions`, `stats`, `transactions`
- `trading` — `placeOrder`, `orders`, `getOrder`, `cancelOrder`
- `leaderboards` — `page(scope, opts)`
- `education` — `lessons`, `lesson`, `progress`, `complete`

## Auth & token refresh

Pass a `TokenProvider` so the SDK can read/persist tokens against your storage
(memory, `localStorage`, Expo `SecureStore`, …). The client attaches
`Authorization: Bearer <accessToken>` to non-anonymous requests and, on a `401`,
transparently calls `/auth/refresh` once and replays the original request.
Concurrent 401s collapse into a single refresh. If refresh fails, tokens are
cleared (logged out). `MemoryTokenProvider` is included for servers and tests.

Uses the global `fetch` (Node 18+, browsers, React Native). Inject a custom
`fetch` via `options.fetch` for SSR or tests.
