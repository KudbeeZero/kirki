import { Injectable } from '@nestjs/common';
import type { AppRole, User, UUID } from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';

/** Internal row shape including security columns never exposed over the wire. */
export interface UserRecord {
  id: UUID;
  email: string | null;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  is_guest: boolean;
  xp: string;
  current_tier: User['currentTier'];
  email_verified_at: Date | null;
  mfa_enabled: boolean;
  failed_login_count: number;
  locked_until: Date | null;
  created_at: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const { rows } = await this.db.query<UserRecord>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return rows[0] ?? null;
  }

  async findById(id: UUID): Promise<UserRecord | null> {
    const { rows } = await this.db.query<UserRecord>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async getPasswordHash(userId: UUID): Promise<string | null> {
    const { rows } = await this.db.query<{ password_hash: string | null }>(
      `SELECT password_hash FROM auth_identities
        WHERE user_id = $1 AND provider = 'email'`,
      [userId],
    );
    return rows[0]?.password_hash ?? null;
  }

  /** Create a user + email identity atomically. */
  async createEmailUser(input: {
    email: string;
    handle: string;
    passwordHash: string;
  }): Promise<UserRecord> {
    return this.db.tx(async (client) => {
      const { rows } = await client.query<UserRecord>(
        `INSERT INTO users (email, handle) VALUES ($1, $2) RETURNING *`,
        [input.email, input.handle],
      );
      const user = rows[0]!;
      await client.query(
        `INSERT INTO auth_identities (user_id, provider, provider_uid, password_hash)
         VALUES ($1, 'email', $2, $3)`,
        [user.id, input.email, input.passwordHash],
      );
      return user;
    });
  }

  async recordFailedLogin(userId: UUID, maxAttempts: number, lockMs: number): Promise<void> {
    await this.db.query(
      `UPDATE users
          SET failed_login_count = failed_login_count + 1,
              locked_until = CASE WHEN failed_login_count + 1 >= $2
                                  THEN now() + ($3 || ' milliseconds')::interval
                                  ELSE locked_until END
        WHERE id = $1`,
      [userId, maxAttempts, lockMs],
    );
  }

  async clearLoginFailures(userId: UUID): Promise<void> {
    await this.db.query(
      `UPDATE users
          SET failed_login_count = 0, locked_until = NULL, last_login_at = now()
        WHERE id = $1`,
      [userId],
    );
  }

  async updatePassword(userId: UUID, passwordHash: string): Promise<void> {
    await this.db.query(
      `UPDATE auth_identities SET password_hash = $2
        WHERE user_id = $1 AND provider = 'email'`,
      [userId, passwordHash],
    );
  }

  /** Map an internal record to the public-safe DTO. */
  toPublic(r: UserRecord): User {
    return {
      id: r.id,
      email: r.email,
      handle: r.handle,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      role: r.role,
      isGuest: r.is_guest,
      xp: Number(r.xp),
      currentTier: r.current_tier,
      emailVerified: r.email_verified_at != null,
      mfaEnabled: r.mfa_enabled,
      createdAt: r.created_at.toISOString(),
    };
  }
}
