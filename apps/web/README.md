# @simcoin/web

The **primary, mobile-first client** for Simcoin — "Duolingo for crypto trading."
Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind, and the
shared ShadCN-based `@simcoin/ui` component library.

## Routes

| Route | Group | Description |
| --- | --- | --- |
| `/` | — | Marketing landing (hero, features, CTA). Public. |
| `/login`, `/register` | `(auth)` | Auth forms wired to `@simcoin/sdk` (`api.auth`). |
| `/dashboard` | `(app)` | Portfolio overview: value, cash, PnL, open positions. |
| `/markets` | `(app)` | Live price list using `PriceTicker`, links to trade. |
| `/trade/[symbol]` | `(app)` | Buy/sell market-order panel for one asset. |
| `/leaderboard` | `(app)` | Ranked leagues by scope (daily…season). |
| `/learn` | `(app)` | Lessons grouped by module with XP + progress. |

The `(app)` group shares a mobile-first shell with a fixed bottom tab bar
(`app/(app)/layout.tsx`), mirroring the native client in `apps/mobile`.

## API & auth

`lib/api.ts` constructs a single `SimcoinClient` from `@simcoin/sdk` pointed at
the gateway (`NEXT_PUBLIC_API_URL`, default `http://localhost:3000/api`).

- The **access token is kept in memory only** (never `localStorage`) so XSS
  can't exfiltrate it.
- The **refresh token lives in an httpOnly Secure cookie** set by the gateway.
  The SDK refreshes transparently on a 401 (`POST /auth/refresh`), the browser
  attaches the cookie because our `fetch` uses `credentials: 'include'`, and the
  original request is replayed once.
- `adoptSession()` stores the access token after login/register; `signOut()`
  clears it and asks the gateway to drop the cookie.

## Data wiring status

Screens import the correct `@simcoin/types` shapes and call the SDK where it is
natural (markets, prices, orders, leaderboards, lessons). Where the backend is
not reachable yet, pages render **typed mock data** and are marked with a clear
`// TODO` for live wiring (auth gating, WebSocket price feed, lesson reader).

## Scripts

```bash
pnpm --filter @simcoin/web dev        # next dev on WEB_PORT (default 3000)
pnpm --filter @simcoin/web build      # production build
pnpm --filter @simcoin/web start      # serve the build
pnpm --filter @simcoin/web lint       # next lint
pnpm --filter @simcoin/web typecheck  # tsc --noEmit
```

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `WEB_PORT` | Dev/start port | `3000` |
| `NEXT_PUBLIC_API_URL` | Public API gateway base URL | `http://localhost:3000/api` |
