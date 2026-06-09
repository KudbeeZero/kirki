import { Injectable, Logger } from '@nestjs/common';
import type { UUID } from '@simcoin/types';

/** Injection token for the set of active {@link NotificationChannel}s. */
export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

/** A notification ready to be delivered over one or more channels. */
export interface Notification {
  /** Recipient user id. */
  userId: UUID;
  /** Short machine code, e.g. `'order.filled'`, used for templating + grouping. */
  kind: string;
  title: string;
  body: string;
  /** Optional deep-link the UI should open. */
  url?: string;
  /** Arbitrary structured payload (e.g. the originating event). */
  data?: Record<string, unknown>;
}

/**
 * A swappable delivery channel (email, web push, in-app, …).
 *
 * The service holds a list of channels and fans a {@link Notification} out to
 * every channel that {@link supports} it for the recipient. New channels (SMS,
 * Slack, …) are added by shipping another implementation — the dispatcher does
 * not change. This is the modularity seam for the notification subsystem.
 */
export interface NotificationChannel {
  /** Stable channel id, e.g. `'email'`, `'web_push'`, `'in_app'`. */
  readonly id: string;

  /**
   * Whether this channel should deliver `n` (e.g. respecting the user's
   * per-channel preferences). Cheap, synchronous check.
   */
  supports(n: Notification): boolean;

  /** Deliver the notification. Implementations must be idempotent per attempt. */
  send(n: Notification): Promise<void>;
}

/**
 * Default in-app channel: persists the notification so it shows in the bell
 * menu. Always supported — it is the durable fallback when email/push are off.
 *
 * The persistence call is delegated to the service (which owns the DB handle);
 * see {@link NotificationService}. Here we keep the channel contract pure.
 */
@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly id = 'in_app';
  private readonly logger = new Logger(InAppChannel.name);

  /** In-app delivery is always available. */
  supports(_n: Notification): boolean {
    return true;
  }

  /**
   * Stage the notification for in-app display.
   * TODO(phase-1): write to the `notifications` table via the shared DB. Left
   * as a logged no-op so the dispatcher wiring is exercisable end-to-end.
   */
  async send(n: Notification): Promise<void> {
    this.logger.debug(`in-app → ${n.userId}: ${n.kind}`);
  }
}

/**
 * Email channel backed by a transactional email provider (e.g. Resend/SES).
 * Bound only when an API key is configured.
 */
@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly id = 'email';
  private readonly logger = new Logger(EmailChannel.name);

  /** Only kinds worth an email (avoid inbox spam from high-frequency events). */
  supports(n: Notification): boolean {
    return ['security.alert', 'season.rolled', 'achievement.unlocked'].includes(n.kind);
  }

  async send(n: Notification): Promise<void> {
    // TODO(phase-1): call the email provider SDK. Deferred until the provider
    // credential + template set is finalised.
    this.logger.debug(`email → ${n.userId}: ${n.kind}`);
    throw new Error('NotImplemented: EmailChannel.send — pending email provider wiring');
  }
}

/** Web-push channel (VAPID / browser Push API). */
@Injectable()
export class WebPushChannel implements NotificationChannel {
  readonly id = 'web_push';
  private readonly logger = new Logger(WebPushChannel.name);

  supports(n: Notification): boolean {
    return ['order.filled', 'achievement.unlocked'].includes(n.kind);
  }

  async send(n: Notification): Promise<void> {
    // TODO(phase-1): look up the user's push subscriptions and POST via the
    // Web Push protocol. Deferred until VAPID keys are provisioned.
    this.logger.debug(`web-push → ${n.userId}: ${n.kind}`);
    throw new Error('NotImplemented: WebPushChannel.send — pending VAPID provisioning');
  }
}
