# notification-service

Fan-out notifications over email, web push, and in-app. Subscribes to domain
events on Redis (trades, achievements, seasons), translates each into a
`Notification`, and delivers it through every `NotificationChannel` that
supports it. Also serves the in-app inbox API.

## Endpoints (Phase 1)

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/notifications` | Caller's in-app notifications, newest first. `?limit`. |
| `POST` | `/notifications/read` | Mark read. Body `{ ids? }`; omit to mark all read. |

The caller's user id arrives as `x-user-id` from the API gateway.

## Channels — the modularity seam

Everything depends on the `NotificationChannel` interface. `AppModule` assembles
the active set behind the `NOTIFICATION_CHANNELS` token:

- **in-app** — always on; durable inbox row (the bell menu).
- **web push** — VAPID/browser Push for high-signal kinds.
- **email** — transactional provider; bound only when `EMAIL_API_KEY` is set.

Add SMS/Slack/etc. by shipping another implementation and appending it to the
factory — the dispatcher never changes. Channel failures are isolated
(`Promise.allSettled`) so one broken provider can't suppress the rest.

## Status

In-app inbox read/mark-read and the event-driven dispatcher wiring are real;
email/web-push `send` bodies throw (`TODO`) until provider credentials are
provisioned.

## Run locally

```bash
pnpm --filter @simcoin/notification-service dev    # watch mode on :4009
pnpm --filter @simcoin/notification-service test   # unit tests
```
