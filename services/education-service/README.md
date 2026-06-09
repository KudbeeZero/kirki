# education-service (Phase 3)

Learning for Simcoin: lessons, per-user lesson progress, XP accrual, badges,
and certificates. Completing a lesson awards its XP once and may unlock a badge
or certificate when a module is finished.

## Endpoints (Phase 3)

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/lessons` | Lesson catalogue, annotated with the caller's progress. |
| `GET`  | `/lessons/:slug` | A single lesson + progress. |
| `POST` | `/lessons/:slug/complete` | Mark complete, award XP. Body: `{ score? }`. |

The caller's user id, when present, arrives as `x-user-id` from the gateway and
annotates lessons with progress.

## Status

Phase 3. The catalogue read path is real; lesson completion (progress upsert +
XP/badge award) throws (`TODO(phase-3)`) until the Phase-3 schema lands.

## Run locally

```bash
pnpm --filter @simcoin/education-service dev    # watch mode on :4008
pnpm --filter @simcoin/education-service test   # unit tests
```
