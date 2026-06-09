/**
 * Typed Redis facade.
 *
 * Services depend on this narrow interface rather than a concrete client, which
 * (a) keeps the rest of the codebase free of vendor types and (b) makes Redis
 * trivially mockable in tests. A thin adapter wraps `ioredis` (or any client)
 * to satisfy {@link RedisClient}; see {@link createRedisFacade} for the helper
 * layer (JSON (de)serialization, leaderboard sugar) built on top of it.
 *
 * Leaderboards use sorted sets: ZADD to upsert a score, ZREVRANGE to read the
 * top N descending. Scores are JS numbers here because Redis sorted-set scores
 * are IEEE-754 doubles by definition — this is presentation/ranking data, not
 * money, so float is acceptable (money stays in Postgres as Decimal).
 */

/** Subset of a Redis client this package relies on. */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<unknown>;
  /** Event hook the client invokes for each pub/sub message. */
  on(event: 'message', listener: (channel: string, message: string) => void): void;
  zadd(key: string, score: number, member: string): Promise<unknown>;
  /** ZREVRANGE key start stop [WITHSCORES] */
  zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: 'WITHSCORES',
  ): Promise<string[]>;
  zrevrank(key: string, member: string): Promise<number | null>;
  zscore(key: string, member: string): Promise<string | null>;
}

export interface LeaderboardEntry {
  member: string;
  score: number;
  /** Zero-based rank, highest score first. */
  rank: number;
}

export interface Redis {
  /** Get a value, returning null if absent. */
  get(key: string): Promise<string | null>;
  /** Set a value with optional TTL in seconds. */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Set a JSON-serializable value with optional TTL. */
  setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  /** Get and JSON-parse a value, or null when absent. */
  getJson<T>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<number>;
  /** Publish a JSON-serialized event to a channel. Returns subscriber count. */
  publish<T>(channel: string, payload: T): Promise<number>;
  /** Subscribe and invoke `handler` with each parsed message on `channel`. */
  subscribe<T>(channel: string, handler: (payload: T) => void): Promise<void>;

  // ── Leaderboard helpers ───────────────────────────────────────────────────
  /** Upsert a member's score in a sorted set. */
  zadd(key: string, member: string, score: number): Promise<void>;
  /** Top `count` members, highest score first (descending). */
  zrevrange(key: string, count: number, offset?: number): Promise<LeaderboardEntry[]>;
  /** A member's rank (0-based, highest first) or null if absent. */
  rankOf(key: string, member: string): Promise<number | null>;
}

/**
 * Wraps a raw {@link RedisClient} with JSON serialization and leaderboard
 * conveniences. The raw client is only required to implement the subset above.
 */
export function createRedisFacade(client: RedisClient): Redis {
  return {
    get: (key) => client.get(key),

    async set(key, value, ttlSeconds) {
      if (ttlSeconds !== undefined) await client.set(key, value, 'EX', ttlSeconds);
      else await client.set(key, value);
    },

    async setJson(key, value, ttlSeconds) {
      const serialized = JSON.stringify(value);
      if (ttlSeconds !== undefined) await client.set(key, serialized, 'EX', ttlSeconds);
      else await client.set(key, serialized);
    },

    async getJson<T>(key: string): Promise<T | null> {
      const raw = await client.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    },

    del: (...keys) => client.del(...keys),

    publish: (channel, payload) => client.publish(channel, JSON.stringify(payload)),

    async subscribe<T>(channel: string, handler: (payload: T) => void): Promise<void> {
      await client.subscribe(channel);
      client.on('message', (ch, message) => {
        if (ch !== channel) return;
        handler(JSON.parse(message) as T);
      });
    },

    async zadd(key, member, score) {
      await client.zadd(key, score, member);
    },

    async zrevrange(key, count, offset = 0) {
      const stop = offset + count - 1;
      const flat = await client.zrevrange(key, offset, stop, 'WITHSCORES');
      const entries: LeaderboardEntry[] = [];
      // ZREVRANGE WITHSCORES returns [member, score, member, score, ...].
      for (let i = 0; i < flat.length; i += 2) {
        entries.push({
          member: flat[i] as string,
          score: Number(flat[i + 1]),
          rank: offset + i / 2,
        });
      }
      return entries;
    },

    rankOf: (key, member) => client.zrevrank(key, member),
  };
}
