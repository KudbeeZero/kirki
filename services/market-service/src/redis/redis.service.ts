import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis access for caching the latest tick per symbol and for pub/sub.
 *
 * Pub/sub requires a dedicated connection: once a connection enters subscriber
 * mode it can no longer issue regular commands, so we keep `publisher` (general
 * commands + PUBLISH) separate from `subscriber` (SUBSCRIBE only).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly publisher: Redis;
  readonly subscriber: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.publisher = new Redis(url);
    this.subscriber = new Redis(url);
  }

  /** Cache the latest value for a key with an optional TTL (seconds). */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.publisher.set(key, value, 'EX', ttlSeconds);
    else await this.publisher.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.publisher.get(key);
  }

  /** Publish a JSON-serialisable payload on a pub/sub channel. */
  async publish(channel: string, payload: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(payload));
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.publisher.quit(), this.subscriber.quit()]);
  }
}
