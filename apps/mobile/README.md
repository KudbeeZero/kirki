# @simcoin/mobile

The Simcoin **mobile client** — Expo / React Native. **Phase 2** of the roadmap;
this is an early scaffold, not yet feature-complete.

> The web app (`@simcoin/web`) is the primary, mobile-first client for Phase 1.
> This native app follows and, critically, **shares the same `@simcoin/sdk` and
> `@simcoin/types`** as web — so both clients speak the identical API contract
> and the wire format never drifts between platforms.

## What's here

- `App.tsx` — a bottom-tab navigation shell (React Navigation) with four tabs:
  **Markets · Portfolio · Leaderboard · Learn**, mirroring the web `(app)`
  section.
- `src/screens.tsx` — placeholder screens. Each imports the canonical
  `@simcoin/types` shape it will render (`PriceTick`, `Position`,
  `LeaderboardEntry`, `Lesson`) and shows typed mock data.
- `src/api.ts` — constructs the shared `SimcoinClient`. Uses the SDK's in-memory
  token provider for now.

## Phase-2 TODOs

- Secure token storage via `expo-secure-store` (Keychain / Keystore) behind a
  `TokenProvider`, plus OAuth and wallet-connect, mirroring the web auth flow.
- Live data through the SDK (markets, portfolio, leaderboards, lessons).
- A trade screen and WebSocket price streaming.

## Scripts

```bash
pnpm --filter @simcoin/mobile start      # expo start (dev menu)
pnpm --filter @simcoin/mobile ios        # run on iOS simulator
pnpm --filter @simcoin/mobile android    # run on Android emulator
pnpm --filter @simcoin/mobile typecheck  # tsc --noEmit
```

## Configuration

The API base URL is read from `expo.extra.apiUrl` in `app.json`
(default `http://localhost:3000/api`).
