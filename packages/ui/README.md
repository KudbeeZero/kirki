# @simcoin/ui

Shared React component library for Simcoin, consumed by `apps/web` and
`apps/admin`. Components are ShadCN-style: unstyled-by-default primitives that
render against a shared set of Tailwind / CSS-variable design tokens.

## Conventions

- Components are **presentational**. Data fetching, polling, and WebSocket
  subscriptions live in the apps; components receive already-typed props.
- Props are typed against [`@simcoin/types`](../types) where a domain shape
  exists (e.g. `PriceTicker` takes a `PriceTick`).
- Styling depends on the design tokens declared in each app's `globals.css`
  (`--primary`, `--bull`, `--bear`, …). Each app's `tailwind.config.ts` must
  include `../../packages/ui/src/**/*.{ts,tsx}` in its `content` glob so the
  class names survive purge.

## Exports

| Export | Description |
| --- | --- |
| `Button` | Variant/size button (`primary`, `secondary`, `outline`, `ghost`, `destructive`). |
| `Card`, `CardHeader`, `CardTitle`, `CardContent` | Surface container primitives. |
| `PriceTicker` | Live price row: symbol, price, bull/bear-tinted 24h change. |
| `cn` | Dependency-free className combiner. |

The library ships raw TypeScript (`main` points at `src/`); apps compile it via
`transpilePackages`, so there is no separate build step in dev.
