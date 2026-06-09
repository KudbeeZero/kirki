import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import type { AccessTokenClaims, AppRole, UUID } from '@simcoin/types';
import { securityConfig } from '../config/security.config.js';

/**
 * Issues short-lived access JWTs and high-entropy opaque refresh tokens.
 *
 * Refresh tokens are NEVER stored in plaintext — only their SHA-256 hash is
 * persisted (sessions.refresh_token_hash). The raw value exists only in the
 * client's HttpOnly cookie. This means a database leak cannot be used to mint
 * sessions.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  async signAccessToken(params: {
    userId: UUID;
    role: AppRole;
    sessionId: UUID;
    mfaSatisfied: boolean;
  }): Promise<string> {
    const claims: Omit<AccessTokenClaims, 'iat' | 'exp'> = {
      sub: params.userId,
      role: params.role,
      sid: params.sessionId,
      mfa: params.mfaSatisfied,
    };
    return this.jwt.signAsync(claims, {
      expiresIn: securityConfig.accessToken.ttlSeconds,
      algorithm: securityConfig.accessToken.algorithm,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    return this.jwt.verifyAsync<AccessTokenClaims>(token);
  }

  /** Generate an opaque refresh token and its storable hash. */
  newRefreshToken(): { raw: string; hash: string } {
    const raw = randomBytes(securityConfig.refreshToken.byteLength).toString('base64url');
    return { raw, hash: this.hashToken(raw) };
  }

  /** Stable, fast hash for opaque tokens (refresh, email/reset nonces). */
  hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
