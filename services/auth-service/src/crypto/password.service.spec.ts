import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const svc = new PasswordService();

  it('hashes and verifies a strong password', async () => {
    const hash = await svc.hash('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(svc.verify(hash, 'correct horse battery staple')).resolves.toBe(true);
  });

  it('rejects an incorrect password (constant-time)', async () => {
    const hash = await svc.hash('correct horse battery staple');
    await expect(svc.verify(hash, 'wrong password here!!')).resolves.toBe(false);
  });

  it('returns false instead of throwing on a malformed hash', async () => {
    await expect(svc.verify('not-a-hash', 'whatever you like')).resolves.toBe(false);
  });

  it('enforces the minimum length policy', async () => {
    await expect(svc.hash('short')).rejects.toThrow(/at least/);
  });

  it('rejects obviously weak passwords', async () => {
    await expect(svc.hash('password1234')).rejects.toThrow(/too weak/);
    await expect(svc.hash('aaaaaaaaaaaa')).rejects.toThrow(/too weak/);
  });
});
