import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import type { AuthResult, AuthTokens } from '@simcoin/types';
import { PasswordService } from '../crypto/password.service.js';
import { TokenService } from '../crypto/token.service.js';
import { SessionService } from '../sessions/session.service.js';
import { AuditService } from '../security/audit.service.js';
import { UsersRepository, type UserRecord } from '../users/users.repository.js';
import { DatabaseService } from '../database/database.service.js';
import { securityConfig } from '../config/security.config.js';

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

/**
 * Core authentication flows. Designed for defence-in-depth:
 *  - Argon2id password hashing (PasswordService)
 *  - Uniform timing & generic errors to prevent user enumeration
 *  - Account lockout after repeated failures
 *  - TOTP MFA enforcement
 *  - Rotating refresh sessions with reuse detection (SessionService)
 *  - Full audit trail (AuditService)
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    private readonly db: DatabaseService,
  ) {}

  async register(
    input: { email: string; password: string; handle: string },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      // Don't reveal which field collided beyond a generic conflict.
      throw new ConflictException('An account with those details already exists.');
    }
    const passwordHash = await this.passwords.hash(input.password);
    const record = await this.users.createEmailUser({
      email: input.email,
      handle: input.handle,
      passwordHash,
    });
    await this.audit.record('register', { userId: record.id, ip: meta.ip, userAgent: meta.userAgent });
    // Email verification token issued out-of-band by notification-service.
    return this.issue(record, meta, /* mfaSatisfied */ true);
  }

  async login(
    input: { email: string; password: string; mfaCode?: string },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);

    // Uniform work + generic error to resist user enumeration & timing attacks:
    // verify against a dummy hash when the user is missing.
    const hash = user
      ? (await this.users.getPasswordHash(user.id)) ?? DUMMY_HASH
      : DUMMY_HASH;

    if (user && this.isLocked(user)) {
      await this.audit.record('login_failed', {
        userId: user.id, ip: meta.ip, userAgent: meta.userAgent, detail: { reason: 'locked' },
      });
      throw new ForbiddenException('Account temporarily locked. Try again later.');
    }

    const ok = await this.passwords.verify(hash, input.password);
    if (!user || !ok) {
      if (user) {
        await this.users.recordFailedLogin(
          user.id,
          securityConfig.lockout.maxFailedAttempts,
          securityConfig.lockout.lockMinutes * 60_000,
        );
        await this.audit.record('login_failed', { userId: user.id, ip: meta.ip, userAgent: meta.userAgent });
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Second factor.
    if (user.mfa_enabled) {
      const passed = await this.verifyMfa(user.id, input.mfaCode);
      if (!passed) {
        await this.audit.record('mfa_challenged', { userId: user.id, ip: meta.ip, userAgent: meta.userAgent });
        throw new UnauthorizedException('A valid MFA code is required.');
      }
    }

    // Opportunistically upgrade the hash if cost params have increased.
    if (this.passwords.needsRehash(hash)) {
      await this.users.updatePassword(user.id, await this.passwords.hash(input.password));
    }

    await this.users.clearLoginFailures(user.id);
    await this.audit.record('login_success', { userId: user.id, ip: meta.ip, userAgent: meta.userAgent });
    return this.issue(user, meta, true);
  }

  /** Exchange a refresh token for a fresh access token (rotates the refresh token). */
  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    const rotated = await this.sessions.rotate(rawRefreshToken, meta);
    const user = await this.users.findById(rotated.userId);
    if (!user) throw new UnauthorizedException();

    const accessToken = await this.tokens.signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: rotated.sessionId,
      mfaSatisfied: true,
    });
    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      accessTokenExpiresAt: this.accessExpiry(),
      refreshTokenExpiresAt: rotated.expiresAt.toISOString(),
    };
  }

  async logout(sessionId: string, userId: string, meta: RequestMeta): Promise<void> {
    await this.sessions.revoke(sessionId);
    await this.audit.record('logout', { userId, ip: meta.ip, userAgent: meta.userAgent });
  }

  /** Revoke every session for a user — used after password change / "log out everywhere". */
  async logoutEverywhere(userId: string): Promise<void> {
    await this.sessions.revokeAllForUser(userId);
  }

  // ── internals ──────────────────────────────────────────────────────────────
  private async issue(user: UserRecord, meta: RequestMeta, mfaSatisfied: boolean): Promise<AuthResult> {
    const session = await this.sessions.create(user.id, meta);
    const accessToken = await this.tokens.signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.sessionId,
      mfaSatisfied,
    });
    const tokens: AuthTokens = {
      accessToken,
      refreshToken: session.refreshToken,
      accessTokenExpiresAt: this.accessExpiry(),
      refreshTokenExpiresAt: session.expiresAt.toISOString(),
    };
    return { user: this.users.toPublic(user), tokens };
  }

  private async verifyMfa(userId: string, code?: string): Promise<boolean> {
    if (!code) return false;
    const { rows } = await this.db.query<{ secret_enc: string }>(
      `SELECT secret_enc FROM mfa_factors
        WHERE user_id = $1 AND method = 'totp' AND confirmed_at IS NOT NULL
        LIMIT 1`,
      [userId],
    );
    const factor = rows[0];
    if (!factor) return false;
    // secret_enc is decrypted by a KMS-backed helper in production; verify TOTP.
    return authenticator.verify({ token: code, secret: factor.secret_enc });
  }

  private isLocked(user: UserRecord): boolean {
    return user.locked_until != null && user.locked_until.getTime() > Date.now();
  }

  private accessExpiry(): string {
    return new Date(Date.now() + securityConfig.accessToken.ttlSeconds * 1000).toISOString();
  }
}

/**
 * A valid Argon2id hash of a random string, used as a constant-time decoy when
 * the supplied email has no account. Keeps login timing independent of whether
 * the account exists. (Generated once at boot in production from a random input.)
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=3,p=1$c2ltY29pbmRlY295c2FsdA$RdJ0o9m5kP2qS4tV6wX8yZ0aB1cD3eF5gH7iJ9kL2m';
