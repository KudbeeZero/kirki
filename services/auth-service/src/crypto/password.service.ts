import { Injectable, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { securityConfig } from '../config/security.config.js';

/**
 * Password hashing & policy. Uses Argon2id with OWASP-aligned parameters.
 * Verification is constant-time (argon2.verify). Hashes are self-describing,
 * so we can raise cost parameters over time and re-hash transparently.
 */
@Injectable()
export class PasswordService {
  private readonly opts = securityConfig.password.argon2;

  async hash(plain: string): Promise<string> {
    this.assertPolicy(plain);
    return argon2.hash(plain, this.opts);
  }

  /** Constant-time verify. Returns false on any malformed-hash error. */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain, this.opts);
    } catch {
      return false;
    }
  }

  /** True when the stored hash was made with weaker params and should be upgraded. */
  needsRehash(hash: string): boolean {
    try {
      return argon2.needsRehash(hash, this.opts);
    } catch {
      return true;
    }
  }

  private assertPolicy(plain: string): void {
    const { minLength } = securityConfig.password;
    if (plain.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters.`);
    }
    // Reject obvious low-entropy passwords. A breached-password check (e.g.
    // HaveIBeenPwned k-anonymity range query) is wired in the auth flow.
    if (/^(.)\1+$/.test(plain) || /^(?:password|12345678|qwerty)/i.test(plain)) {
      throw new BadRequestException('Password is too weak.');
    }
  }
}
