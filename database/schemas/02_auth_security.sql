-- ════════════════════════════════════════════════════════════════════════
-- Simcoin auth & security tables (PostgreSQL 16)                        [P1]
--
-- Backs the full login/authentication system: sessions with refresh-token
-- rotation, email verification, password reset, wallet-connect challenges,
-- MFA, and a tamper-evident security audit log.
-- ════════════════════════════════════════════════════════════════════════

CREATE TYPE token_purpose AS ENUM ('email_verify', 'password_reset', 'wallet_nonce');
CREATE TYPE mfa_method    AS ENUM ('totp', 'webauthn');
CREATE TYPE security_event AS ENUM (
    'login_success', 'login_failed', 'logout', 'register',
    'password_changed', 'password_reset_requested', 'password_reset_completed',
    'email_verified', 'token_refreshed', 'token_reuse_detected',
    'mfa_enabled', 'mfa_disabled', 'mfa_challenged', 'account_locked'
);

-- ── Sessions / refresh-token rotation ─────────────────────────────────────
-- One row per active login session. The refresh token is stored ONLY as a
-- hash. On refresh we rotate: the old token is revoked and a child is issued.
-- Presenting an already-rotated (revoked) token => reuse attack => revoke the
-- whole family (see token_reuse_detected handling in auth-service).
CREATE TABLE sessions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id          UUID NOT NULL,                  -- shared across a rotation chain
    refresh_token_hash TEXT NOT NULL,                  -- sha-256 of opaque token
    parent_id          UUID REFERENCES sessions(id),   -- previous link in the chain
    user_agent         TEXT,
    ip                 INET,
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx   ON sessions (user_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX sessions_hash_idx ON sessions (refresh_token_hash);
CREATE INDEX sessions_family_idx  ON sessions (family_id);

-- ── Single-use, hashed verification / reset / nonce tokens ────────────────
CREATE TABLE verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    purpose     token_purpose NOT NULL,
    token_hash  TEXT NOT NULL,                         -- never store the raw token
    context     JSONB,                                 -- e.g. { "chain": "...", "address": "..." }
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX verification_tokens_hash_idx ON verification_tokens (token_hash);
CREATE INDEX verification_tokens_user_idx ON verification_tokens (user_id, purpose);

-- ── Multi-factor authentication ───────────────────────────────────────────
CREATE TABLE mfa_factors (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method       mfa_method NOT NULL,
    secret_enc   TEXT NOT NULL,                        -- encrypted TOTP secret / credential
    confirmed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mfa_recovery_codes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  TEXT NOT NULL,                          -- hashed, single use
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Brute-force protection ────────────────────────────────────────────────
-- Tracks failed login attempts per identifier (email/ip) to drive lockouts.
ALTER TABLE users
    ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN locked_until       TIMESTAMPTZ,
    ADD COLUMN email_verified_at  TIMESTAMPTZ,
    ADD COLUMN last_login_at      TIMESTAMPTZ,
    ADD COLUMN mfa_enabled        BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Roles (RBAC) ──────────────────────────────────────────────────────────
CREATE TYPE app_role AS ENUM ('player', 'creator', 'moderator', 'admin');
ALTER TABLE users ADD COLUMN role app_role NOT NULL DEFAULT 'player';

-- ── Security audit log (append-only) ──────────────────────────────────────
CREATE TABLE security_audit_log (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    event      security_event NOT NULL,
    ip         INET,
    user_agent TEXT,
    detail     JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX security_audit_user_idx ON security_audit_log (user_id, created_at DESC);
CREATE INDEX security_audit_event_idx ON security_audit_log (event, created_at DESC);
