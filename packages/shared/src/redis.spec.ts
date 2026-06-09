import { describe, it, expect, vi } from 'vitest';
import { createRedisFacade, type RedisClient } from './redis.js';

/**
 * A controllable fake implementing the narrow RedisClient subset, so the facade
 * (JSON (de)serialization, leaderboard parsing) can be tested without a server.
 */
function fakeClient(overrides: Partial<RedisClient> = {}): RedisClient {
  return {
    get: vi.fn(async () => null),
    set: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
    publish: vi.fn(async () => 3),
    subscribe: vi.fn(async () => undefined),
    on: vi.fn(),
    zadd: vi.fn(async () => 1),
    zrevrange: vi.fn(async () => []),
    zrevrank: vi.fn(async () => null),
    zscore: vi.fn(async () => null),
    ...overrides,
  };
}

describe('createRedisFacade', () => {
  it('set passes EX + ttl only when a ttl is given', async () => {
    const client = fakeClient();
    const r = createRedisFacade(client);
    await r.set('k', 'v');
    expect(client.set).toHaveBeenCalledWith('k', 'v');
    await r.set('k', 'v', 30);
    expect(client.set).toHaveBeenCalledWith('k', 'v', 'EX', 30);
  });

  it('setJson serializes and getJson parses', async () => {
    let stored: string | null = null;
    const client = fakeClient({
      set: vi.fn(async (_k, v) => {
        stored = v;
        return 'OK';
      }),
      get: vi.fn(async () => stored),
    });
    const r = createRedisFacade(client);
    await r.setJson('user:1', { id: 1, handle: 'alice' });
    expect(stored).toBe('{"id":1,"handle":"alice"}');
    await expect(r.getJson<{ handle: string }>('user:1')).resolves.toEqual({
      id: 1,
      handle: 'alice',
    });
  });

  it('getJson returns null when the key is absent', async () => {
    const r = createRedisFacade(fakeClient({ get: vi.fn(async () => null) }));
    await expect(r.getJson('missing')).resolves.toBeNull();
  });

  it('publish serializes the payload to JSON', async () => {
    const client = fakeClient();
    const r = createRedisFacade(client);
    const n = await r.publish('chan', { type: 'price.tick', price: '42' });
    expect(client.publish).toHaveBeenCalledWith('chan', '{"type":"price.tick","price":"42"}');
    expect(n).toBe(3);
  });

  it('subscribe parses messages and ignores other channels', async () => {
    let listener!: (channel: string, message: string) => void;
    const client = fakeClient({
      on: vi.fn((_e, l) => {
        listener = l;
      }),
    });
    const r = createRedisFacade(client);
    const handler = vi.fn();
    await r.subscribe<{ v: number }>('mychan', handler);
    expect(client.subscribe).toHaveBeenCalledWith('mychan');

    listener('otherchan', '{"v":1}'); // wrong channel → ignored
    listener('mychan', '{"v":2}'); // right channel → parsed
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ v: 2 });
  });

  it('zadd maps to the client (score, member) argument order', async () => {
    const client = fakeClient();
    const r = createRedisFacade(client);
    await r.zadd('lb:season1', 'user-7', 1234.5);
    expect(client.zadd).toHaveBeenCalledWith('lb:season1', 1234.5, 'user-7');
  });

  it('zrevrange parses the flat WITHSCORES array into ranked entries', async () => {
    const client = fakeClient({
      zrevrange: vi.fn(async () => ['alice', '300', 'bob', '200', 'cara', '100']),
    });
    const r = createRedisFacade(client);
    const top = await r.zrevrange('lb', 3);
    expect(client.zrevrange).toHaveBeenCalledWith('lb', 0, 2, 'WITHSCORES');
    expect(top).toEqual([
      { member: 'alice', score: 300, rank: 0 },
      { member: 'bob', score: 200, rank: 1 },
      { member: 'cara', score: 100, rank: 2 },
    ]);
  });

  it('zrevrange honors offset in both the range request and the ranks', async () => {
    const client = fakeClient({
      zrevrange: vi.fn(async () => ['dan', '90', 'eve', '80']),
    });
    const r = createRedisFacade(client);
    const page = await r.zrevrange('lb', 2, 3);
    expect(client.zrevrange).toHaveBeenCalledWith('lb', 3, 4, 'WITHSCORES');
    expect(page.map((e) => e.rank)).toEqual([3, 4]);
  });

  it('rankOf delegates to zrevrank', async () => {
    const client = fakeClient({ zrevrank: vi.fn(async () => 5) });
    const r = createRedisFacade(client);
    await expect(r.rankOf('lb', 'user-1')).resolves.toBe(5);
  });
});
