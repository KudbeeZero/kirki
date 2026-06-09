import { UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service.js';
import { TokenService } from '../crypto/token.service.js';

/**
 * Focused tests for the refresh-token rotation & reuse-detection logic — the
 * most security-critical part of session handling. The DB and audit sink are
 * faked so we exercise pure control flow.
 */
describe('SessionService rotation & reuse detection', () => {
  const tokens = new TokenService({
    signAsync: async () => 'jwt',
    verifyAsync: async () => ({}),
  } as never);

  function makeDb(initialRow: Record<string, unknown> | null) {
    const calls: string[] = [];
    return {
      calls,
      query: jest.fn(async (text: string) => {
        calls.push(text.trim().split('\n')[0]!);
        if (text.includes('SELECT id, user_id, family_id')) {
          return { rows: initialRow ? [initialRow] : [] };
        }
        return { rows: [{ id: 'child-session' }] };
      }),
      tx: jest.fn(async (fn: (c: unknown) => Promise<unknown>) =>
        fn({ query: async () => ({ rows: [{ id: 'child-session' }] }) }),
      ),
    };
  }

  const audit = { record: jest.fn(async () => {}) };

  beforeEach(() => audit.record.mockClear());

  it('rejects an unknown refresh token', async () => {
    const db = makeDb(null);
    const svc = new SessionService(db as never, tokens, audit as never);
    await expect(svc.rotate('bogus', {})).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('detects reuse of a revoked token and revokes the family', async () => {
    const db = makeDb({
      id: 's1',
      user_id: 'u1',
      family_id: 'fam1',
      revoked_at: new Date(),
      expires_at: new Date(Date.now() + 1e6),
    });
    const svc = new SessionService(db as never, tokens, audit as never);

    await expect(svc.rotate('stolen', {})).rejects.toThrow(/reuse detected/);
    expect(audit.record).toHaveBeenCalledWith('token_reuse_detected', expect.anything());
    // family-revocation UPDATE was issued
    expect(db.calls.some((c) => c.includes('UPDATE sessions SET revoked_at'))).toBe(true);
  });

  it('rejects an expired token', async () => {
    const db = makeDb({
      id: 's1', user_id: 'u1', family_id: 'fam1',
      revoked_at: null, expires_at: new Date(Date.now() - 1000),
    });
    const svc = new SessionService(db as never, tokens, audit as never);
    await expect(svc.rotate('expired', {})).rejects.toThrow(/expired/);
  });

  it('rotates a valid token into a new child session', async () => {
    const db = makeDb({
      id: 's1', user_id: 'u1', family_id: 'fam1',
      revoked_at: null, expires_at: new Date(Date.now() + 1e6),
    });
    const svc = new SessionService(db as never, tokens, audit as never);
    const result = await svc.rotate('valid', {});
    expect(result.userId).toBe('u1');
    expect(result.sessionId).toBe('child-session');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(audit.record).toHaveBeenCalledWith('token_refreshed', expect.anything());
  });
});
