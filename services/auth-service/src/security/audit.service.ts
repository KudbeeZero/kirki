import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export type SecurityEvent =
  | 'login_success' | 'login_failed' | 'logout' | 'register'
  | 'password_changed' | 'password_reset_requested' | 'password_reset_completed'
  | 'email_verified' | 'token_refreshed' | 'token_reuse_detected'
  | 'mfa_enabled' | 'mfa_disabled' | 'mfa_challenged' | 'account_locked';

export interface AuditContext {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  detail?: Record<string, unknown>;
}

/**
 * Append-only security audit trail. Every security-relevant action is recorded
 * for forensics, anomaly detection, and compliance. Writes are best-effort and
 * must never block or fail the primary auth flow.
 */
@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async record(event: SecurityEvent, ctx: AuditContext = {}): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO security_audit_log (user_id, event, ip, user_agent, detail)
         VALUES ($1, $2, $3, $4, $5)`,
        [ctx.userId ?? null, event, ctx.ip ?? null, ctx.userAgent ?? null, ctx.detail ?? null],
      );
    } catch {
      // Swallow: auditing must not break authentication. A separate alert
      // fires if the audit pipeline goes silent.
    }
  }
}
