import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { UUID } from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { TokenService } from '../crypto/token.service.js';
import { AuditService } from '../security/audit.service.js';
import { securityConfig } from '../config/security.config.js';

interface SessionRow {
  id: UUID;
  user_id: UUID;
  family_id: UUID;
  revoked_at: Date | null;
  expires_at: Date;
}

/**
 * Manages refresh-token sessions with rotation and reuse detection.
 *
 * Security model (OWASP refresh-token rotation):
 *  - Each login starts a token "family".
 *  - Every refresh rotates: the presented token is revoked and a child issued.
 *  - If a *revoked* token is presented again, that's a reuse attack (the token
 *    was stolen and replayed). We revoke the entire family, forcing re-login,
 *    and log `token_reuse_detected`.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Create a brand-new session family on login. Returns the raw refresh token. */
  async create(userId: UUID, meta: { ip?: string; userAgent?: string }): Promise<{
    sessionId: UUID;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const { raw, hash } = this.tokens.newRefreshToken();
    const familyId = randomUUID();
    const expiresAt = new Date(Date.now() + securityConfig.refreshToken.ttlSeconds * 1000);

    const { rows } = await this.db.query<{ id: UUID }>(
      `INSERT INTO sessions (user_id, family_id, refresh_token_hash, user_agent, ip, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, familyId, hash, meta.userAgent ?? null, meta.ip ?? null, expiresAt],
    );
    return { sessionId: rows[0]!.id, refreshToken: raw, expiresAt };
  }

  /**
   * Rotate a refresh token. Validates, detects reuse, issues a child token.
   * Throws UnauthorizedException on any invalid/expired/reused token.
   */
  async rotate(rawToken: string, meta: { ip?: string; userAgent?: string }): Promise<{
    userId: UUID;
    sessionId: UUID;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const hash = this.tokens.hashToken(rawToken);
    const { rows } = await this.db.query<SessionRow>(
      `SELECT id, user_id, family_id, revoked_at, expires_at
         FROM sessions WHERE refresh_token_hash = $1`,
      [hash],
    );
    const session = rows[0];

    if (!session) throw new UnauthorizedException('Invalid refresh token.');

    // Reuse detection: a revoked token being presented => compromise.
    if (session.revoked_at) {
      await this.revokeFamily(session.family_id);
      await this.audit.record('token_reuse_detected', {
        userId: session.user_id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        detail: { familyId: session.family_id },
      });
      throw new UnauthorizedException('Refresh token reuse detected. Please sign in again.');
    }

    if (session.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired.');
    }

    // Rotate within the same family.
    const { raw, hash: childHash } = this.tokens.newRefreshToken();
    const expiresAt = new Date(Date.now() + securityConfig.refreshToken.ttlSeconds * 1000);

    const childId = await this.db.tx(async (client) => {
      await client.query('UPDATE sessions SET revoked_at = now() WHERE id = $1', [session.id]);
      const child = await client.query<{ id: UUID }>(
        `INSERT INTO sessions
           (user_id, family_id, refresh_token_hash, parent_id, user_agent, ip, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [session.user_id, session.family_id, childHash, session.id, meta.userAgent ?? null, meta.ip ?? null, expiresAt],
      );
      return child.rows[0]!.id;
    });

    await this.audit.record('token_refreshed', { userId: session.user_id, ip: meta.ip, userAgent: meta.userAgent });
    return { userId: session.user_id, sessionId: childId, refreshToken: raw, expiresAt };
  }

  /** Revoke a single session (logout this device). */
  async revoke(sessionId: UUID): Promise<void> {
    await this.db.query(
      'UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL',
      [sessionId],
    );
  }

  /** Revoke every session in a family (reuse response / "log out everywhere"). */
  async revokeFamily(familyId: UUID): Promise<void> {
    await this.db.query(
      'UPDATE sessions SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL',
      [familyId],
    );
  }

  /** Revoke all of a user's active sessions (e.g. after a password change). */
  async revokeAllForUser(userId: UUID): Promise<void> {
    await this.db.query(
      'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  }
}
