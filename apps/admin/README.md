# @simcoin/admin

Internal **operations console** for Simcoin. Minimal Next.js 15 (App Router)
app that shares the SDK, types, UI library, and Tailwind theme with
[`@simcoin/web`](../web). Staff-only; not indexable.

## What it does

A single dashboard (`app/page.tsx`) with four ops shells:

| Panel | Purpose | Planned endpoint |
| --- | --- | --- |
| User search | Find players by handle / email / id | `GET /admin/users?query=` |
| Season controls | Start the next 30-day season; end the current one | `POST /admin/seasons/start`, `POST /admin/seasons/:id/end` |
| Market toggles | Enable/disable trading per asset | `POST /admin/markets/:symbol/toggle` |
| Audit log | Review staff/system actions | `GET /admin/audit-log` |

## API wiring status

`lib/api.ts` builds a `SimcoinClient` (with `MemoryTokenProvider`) pointed at the
gateway. The SDK does **not yet** expose an `admin` namespace, so the shells call
`api.http.*` directly using the paths in `ADMIN_ENDPOINTS`, and each call site is
marked `// TODO` for promotion to first-class `api.admin.*` resources. Until the
endpoints exist, panels render typed mock data (`@simcoin/types`: `User`,
`Season`, `Market`; plus a local `AuditLogEntry` shape pending a canonical type).

## Scripts

```bash
pnpm --filter @simcoin/admin dev        # next dev on ADMIN_PORT (default 3001)
pnpm --filter @simcoin/admin build
pnpm --filter @simcoin/admin start
pnpm --filter @simcoin/admin lint
pnpm --filter @simcoin/admin typecheck
```

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `ADMIN_PORT` | Dev/start port | `3001` |
| `NEXT_PUBLIC_API_URL` | Public API gateway base URL | `http://localhost:3000/api` |
