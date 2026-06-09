# auth-service

Identity & authentication for Simcoin — the front door, built to be the
**Fort Knox** of the platform. Owns users, sessions, OAuth, wallet-connect,
MFA, and the security audit trail.

## Endpoints (Phase 1)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/auth/register` | public | Email + password + handle. Rate-limited 5/hr/IP. |
| `POST` | `/auth/login` | public | Returns access token (body) + refresh cookie. Rate-limited 10/min/IP. |
| `POST` | `/auth/refresh` | cookie | Rotates the refresh token; detects reuse. |
| `POST` | `/auth/logout` | bearer | Revokes the current session. |
| `GET`  | `/auth/me` | bearer | Returns the caller's claims. |

OAuth (`google`, `x`), wallet-connect (`algorand`/`solana`/`icp`), password
reset, email verification, and MFA enrollment endpoints share the same flows
and are stubbed for incremental rollout.

## Security model — defense in depth

| Layer | Control |
|-------|---------|
| **Password storage** | Argon2id (19 MiB, t=3), self-describing hashes, transparent re-hash on login when cost params rise. |
| **Credential errors** | Generic messages + constant-time decoy hash → no user enumeration / timing leak. |
| **Brute force** | Per-IP rate limiting (Throttler) + per-account lockout after 5 failures. |
| **Sessions** | Short-lived JWT access tokens (15 min) + opaque refresh tokens stored only as SHA-256 hashes. |
| **Refresh rotation** | One-time-use refresh tokens; reuse of a revoked token revokes the whole family and alerts. |
| **Token transport** | Refresh token in `HttpOnly; Secure; SameSite=strict` cookie scoped to `/auth` → XSS-resistant. Access token held in memory, never `localStorage`. |
| **MFA** | TOTP (otplib) with hashed single-use recovery codes; secrets encrypted at rest. |
| **Input** | `class-validator` DTOs with `whitelist` + `forbidNonWhitelisted` → parameter-pollution rejected. |
| **SQL** | Parameterised queries only; no string interpolation. |
| **Headers** | `helmet` (CSP, HSTS, noSniff, frameguard). CORS restricted to first-party origins. |
| **RBAC** | `player`/`creator`/`moderator`/`admin` enforced by `RolesGuard`. |
| **Audit** | Append-only `security_audit_log` for every security event. |

See [`docs/architecture/security.md`](../../docs/architecture/security.md) and the
repository [`SECURITY.md`](../../SECURITY.md) for the full threat model.

## Run locally

```bash
pnpm --filter @simcoin/auth-service dev    # watch mode on :4001
pnpm --filter @simcoin/auth-service test   # unit tests
```
