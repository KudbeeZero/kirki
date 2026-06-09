# Security Policy

Simcoin is built to be the **Fort Knox of trading platforms**. Even though balances
are simulated, we treat accounts, identity, and integrity of competition as if real
money were at stake — because trust *is* the product, and because the platform is a
stepping stone to optional real-wallet and tokenization features.

This document is the top-level summary. The full threat model and control catalogue
live in [`docs/architecture/security.md`](docs/architecture/security.md).

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Email **security@simcoin.app** (or, until that exists, the maintainers directly) with:

- A description of the issue and its impact
- Reproduction steps or a proof of concept
- Affected component/version

We aim to acknowledge within **48 hours** and to provide a remediation timeline within
**5 business days**. We support coordinated disclosure and will credit reporters who
wish to be named. Please give us a reasonable window to fix before public disclosure.

### Safe harbor

Good-faith security research that respects user privacy, avoids data destruction, and
does not degrade service for others will not be pursued legally. Do not access accounts
you don't own, and use only test accounts you control.

## Scope

In scope: the web/admin apps, the public API, and all backend services in this repo.
Out of scope: third-party providers (CoinGecko, OAuth IdPs), social-engineering of
staff, and physical attacks.

## Security posture at a glance

| Domain | Highlights |
|--------|-----------|
| **Authentication** | Argon2id password hashing, generic errors + constant-time decoy (no user enumeration), per-account lockout, TOTP MFA with hashed recovery codes. |
| **Sessions** | 15-min JWT access tokens + opaque refresh tokens stored only as SHA-256 hashes; one-time-use rotation with **reuse detection** (a replayed token revokes the whole family). |
| **Token transport** | Refresh token in `HttpOnly; Secure; SameSite=strict` cookie scoped to `/auth`; access token held in memory only — never `localStorage`. |
| **Transport** | TLS everywhere, HSTS via `helmet`; CORS locked to first-party origins. |
| **Input** | Strict allow-list DTO validation; parameterised SQL only — no string-built queries. |
| **Authorization** | RBAC (`player`/`creator`/`moderator`/`admin`) enforced by guards on every non-public route. |
| **Abuse** | Per-IP rate limiting on auth endpoints; lockouts; anomaly signals from the audit log. |
| **Auditability** | Append-only `security_audit_log` records every security-relevant event. |
| **Secrets** | Loaded from environment, never committed; MFA secrets encrypted at rest (KMS-backed in prod). |
| **Dependencies** | CI runs install/lint/typecheck/test; `pnpm audit` and Dependabot keep deps patched. |

## Hard rules for contributors

1. **Never** log secrets, passwords, tokens, or full PII.
2. **Never** build SQL by string concatenation — use parameterised queries.
3. **Never** store access tokens in `localStorage`/`sessionStorage`.
4. **Never** widen CORS to `*` or disable `helmet`.
5. **Always** add new security-relevant actions to the audit log.
6. **Always** validate and allow-list inbound data at the service boundary.
7. Treat real-money / wallet / NFT features as *opt-in expansions* with their own,
   stricter review — they are never prerequisites to play.
