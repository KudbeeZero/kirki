# Auth API

Identity and session endpoints, served by `auth-service` (`:4001`, P1). Mirrors
[`services/auth-service/README.md`](../../services/auth-service/README.md). Conventions
(error envelope, rate limits, token transport) are in the
[API README](README.md). Types come from
[`@simcoin/types` · `auth.ts`](../../packages/types/src/auth.ts).

## Token model

- **Access token** — JWT with `AccessTokenClaims` (`sub`, `role`, `sid`, `mfa`, `iat`,
  `exp`), 15-minute lifetime. Sent as `Authorization: Bearer <token>`; held in memory.
- **Refresh token** — opaque, stored server-side as a SHA-256 hash, delivered in an
  `HttpOnly; Secure; SameSite=strict` cookie scoped to `/auth`. Rotated on every refresh.

`AuthResult = { user: User; tokens: AuthTokens }` is returned by register and login. The
`tokens.refreshToken` is set as the cookie (not echoed to JS-readable storage).

---

## POST /auth/register

Public. Rate-limited **5 / hour / IP**. Creates a user with an email/password identity.

**Request** — `RegisterRequest`

```json
{ "email": "ada@example.com", "password": "correct horse battery staple", "handle": "ada" }
```

**Response** `201` — `AuthResult` (user + access token in body; refresh cookie set). Emits
`user.registered` (`UserRegisteredEvent`).

| Error | When |
|-------|------|
| `409 HANDLE_TAKEN` / `EMAIL_TAKEN` | `users.handle` / `users.email` unique violation |
| `400 VALIDATION` | DTO fails `class-validator` (whitelist + forbidNonWhitelisted) |

---

## POST /auth/login

Public. Rate-limited **10 / min / IP**; per-account lockout after 5 failures
(`users.failed_login_count` / `locked_until`).

**Request** — `LoginRequest`

```json
{ "email": "ada@example.com", "password": "...", "mfaCode": "123456" }
```

`mfaCode` is required only when the account has MFA enabled.

**Response** `200` — `AuthResult` (access token in body, refresh cookie set). Password
verification uses Argon2id with a constant-time decoy on failure (no user enumeration /
timing leak).

| Error | When |
|-------|------|
| `401 INVALID_CREDENTIALS` | Wrong email/password (generic message) |
| `401 MFA_REQUIRED` | Account has MFA, no/invalid `mfaCode` |
| `423 ACCOUNT_LOCKED` | Lockout window active |

---

## POST /auth/refresh

Cookie auth (the `/auth`-scoped refresh cookie). Rotates the refresh token: the presented
token is revoked and a child is issued, sharing the session `family_id`. Presenting an
already-rotated token is treated as **reuse** → the whole family is revoked and a
`token_reuse_detected` security event is logged.

**Request** — body optional; the token is read from the cookie. (`RefreshRequest` exists
for non-browser clients.)

**Response** `200` — `{ tokens: AuthTokens }`; a new refresh cookie is set.

| Error | When |
|-------|------|
| `401 INVALID_REFRESH` | Unknown / expired token |
| `401 TOKEN_REUSE` | Rotated token replayed; family revoked |

---

## POST /auth/logout

Bearer auth. Revokes the current session (`sessions.revoked_at`) and clears the refresh
cookie.

**Response** `204` — no content.

---

## GET /auth/me

Bearer auth. Returns the caller's profile/claims.

**Response** `200` — `User`

```json
{
  "id": "…", "email": "ada@example.com", "handle": "ada", "displayName": null,
  "avatarUrl": null, "role": "player", "isGuest": false, "xp": 0,
  "currentTier": "bronze", "emailVerified": true, "mfaEnabled": false,
  "createdAt": "2026-06-09T12:00:00Z"
}
```

| Error | When |
|-------|------|
| `401 UNAUTHENTICATED` | Missing/invalid/expired access token |

---

## Stubbed for incremental rollout (P1)

These share the same flows and DTOs and graduate from stubs to live during Phase 1:

| Flow | Endpoint(s) | Types |
|------|-------------|-------|
| OAuth | `POST /auth/oauth/:provider` (`google`, `x`) | `OAuthLoginRequest` |
| Wallet connect | `POST /auth/wallet/nonce`, `POST /auth/wallet/verify` | `WalletNonceRequest` → `WalletNonceResponse`, `WalletVerifyRequest` |
| Email verification | `POST /auth/verify-email` | `verification_tokens (purpose='email_verify')` |
| Password reset | `POST /auth/password/reset`, `POST /auth/password/reset/confirm` | `PasswordResetRequest`, `PasswordResetConfirm` |
| MFA | `POST /auth/mfa/enroll`, `POST /auth/mfa/confirm` | `MfaMethod` (`totp`/`webauthn`); recovery codes hashed single-use |
| Sessions | `GET /auth/sessions`, `DELETE /auth/sessions/:id` | `SessionInfo` |

Wallet connect supports `algorand`/`solana`/`icp` and is **never required to play** — it
only links a `wallets` row (used later at NFT mint time, P5).
</content>
