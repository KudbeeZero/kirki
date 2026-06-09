/**
 * Central security tunables. Every knob that affects the platform's
 * authentication posture lives here so it can be reviewed in one place.
 */
export const securityConfig = {
  password: {
    // Argon2id — memory-hard, resistant to GPU/ASIC cracking. OWASP-aligned.
    argon2: {
      type: 2, // argon2id
      memoryCost: 19456, // 19 MiB
      timeCost: 3,
      parallelism: 1,
    },
    minLength: 12,
    /** Reject the most common/breached passwords (wired to a denylist). */
    rejectBreached: true,
  },

  accessToken: {
    /** Short-lived; compromise window is minutes, not days. */
    ttlSeconds: 15 * 60,
    algorithm: 'HS256' as const, // swap to RS256/asymmetric in prod
  },

  refreshToken: {
    ttlSeconds: 30 * 24 * 60 * 60, // 30 days
    /** Rotate on every use; detect reuse of a revoked token. */
    rotate: true,
    byteLength: 48, // 384 bits of entropy
  },

  lockout: {
    maxFailedAttempts: 5,
    lockMinutes: 15,
  },

  verificationToken: {
    emailVerifyTtlMinutes: 60 * 24,
    passwordResetTtlMinutes: 30,
    walletNonceTtlMinutes: 5,
  },

  cookies: {
    /** Refresh token is delivered as an HttpOnly, Secure, SameSite cookie. */
    refreshCookieName: 'sc_rt',
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/auth',
  },

  rateLimit: {
    // Per-IP throttling on auth endpoints (NestJS Throttler).
    login: { ttlSeconds: 60, limit: 10 },
    register: { ttlSeconds: 60 * 60, limit: 5 },
    passwordReset: { ttlSeconds: 60 * 60, limit: 5 },
  },
} as const;
