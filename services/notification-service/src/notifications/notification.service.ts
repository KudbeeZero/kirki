import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { REDIS_CHANNELS } from '@simcoin/types';
import type {
  AchievementUnlockedEvent,
  OrderFilledEvent,
  SeasonRolledEvent,
  UUID,
} from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  NOTIFICATION_CHANNELS,
  type Notification,
  type NotificationChannel,
} from './notification-channel.js';

/** A persisted in-app notification row as returned to the UI. */
export interface StoredNotification {
  id: UUID;
  userId: UUID;
  kind: string;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Notification service.
 *
 * Subscribes to domain events on Redis (trades, achievements, seasons),
 * translates each into a {@link Notification}, and fans it out to every
 * {@link NotificationChannel} that supports it (in-app always; email/push by
 * kind + user preference). Also serves the in-app inbox read/mark-read API.
 */
@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: NotificationChannel[],
  ) {}

  /** Wire up event subscriptions that drive the fan-out. */
  async onModuleInit(): Promise<void> {
    await this.redis.subscribe<{ type: string; payload: OrderFilledEvent }>(
      REDIS_CHANNELS.trades,
      (evt) => {
        if (evt.type !== 'order.filled') return;
        const o = evt.payload;
        void this.dispatch({
          userId: o.userId,
          kind: 'order.filled',
          title: 'Order filled',
          body: `${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.quantity} ${o.symbol} @ ${o.price}`,
          url: '/portfolio',
          data: o as unknown as Record<string, unknown>,
        });
      },
    );

    await this.redis.subscribe<{ type: string; payload: AchievementUnlockedEvent }>(
      REDIS_CHANNELS.achievements,
      (evt) => {
        if (evt.type !== 'achievement.unlocked') return;
        const a = evt.payload;
        void this.dispatch({
          userId: a.userId,
          kind: 'achievement.unlocked',
          title: 'Achievement unlocked!',
          body: `You earned "${a.achievementCode}" (+${a.xpReward} XP).`,
          url: '/profile',
        });
      },
    );

    await this.redis.subscribe<{ type: string; payload: SeasonRolledEvent }>(
      REDIS_CHANNELS.seasons,
      (evt) => {
        if (evt.type !== 'season.rolled') return;
        // Season roll is a broadcast; recipient fan-out is per-membership.
        this.logger.log(`season rolled → ${evt.payload.newSeasonId}; broadcasting`);
      },
    );
  }

  /**
   * Fan a notification out to every supporting channel. Channel failures are
   * isolated (allSettled) so one broken provider can't suppress the others.
   */
  async dispatch(n: Notification): Promise<void> {
    const targets = this.channels.filter((c) => c.supports(n));
    const results = await Promise.allSettled(targets.map((c) => c.send(n)));
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.warn(`channel ${targets[i]!.id} failed for ${n.kind}: ${r.reason}`);
      }
    });
  }

  /** List the caller's in-app notifications, newest first. */
  async list(userId: UUID, limit = 50): Promise<StoredNotification[]> {
    const { rows } = await this.db.query<StoredNotification>(
      `SELECT id, user_id AS "userId", kind, title, body, url,
              read_at AS "readAt", created_at AS "createdAt"
         FROM notifications WHERE user_id = $1
        ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return rows;
  }

  /**
   * Mark notifications read. With `ids`, marks those; otherwise marks all of the
   * caller's unread notifications read. Returns the count updated.
   */
  async markRead(userId: UUID, ids?: UUID[]): Promise<{ updated: number }> {
    const hasIds = ids && ids.length > 0;
    const { rowCount } = await this.db.query(
      hasIds
        ? `UPDATE notifications SET read_at = now()
            WHERE user_id = $1 AND read_at IS NULL AND id = ANY($2)`
        : `UPDATE notifications SET read_at = now()
            WHERE user_id = $1 AND read_at IS NULL`,
      hasIds ? [userId, ids] : [userId],
    );
    return { updated: rowCount ?? 0 };
  }
}
