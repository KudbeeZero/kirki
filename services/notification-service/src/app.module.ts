import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { RedisService } from './redis/redis.service.js';
import { NotificationController } from './notifications/notification.controller.js';
import { NotificationService } from './notifications/notification.service.js';
import {
  NOTIFICATION_CHANNELS,
  EmailChannel,
  InAppChannel,
  WebPushChannel,
} from './notifications/notification-channel.js';

/**
 * Root module. The set of delivery channels is assembled behind the
 * {@link NOTIFICATION_CHANNELS} token: in-app is always present; email is added
 * only when a provider key is configured. Add a channel by appending to this
 * factory — the dispatcher does not change.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NotificationController],
  providers: [
    DatabaseService,
    RedisService,
    InAppChannel,
    EmailChannel,
    WebPushChannel,
    NotificationService,
    {
      provide: NOTIFICATION_CHANNELS,
      inject: [ConfigService, InAppChannel, EmailChannel, WebPushChannel],
      useFactory: (
        config: ConfigService,
        inApp: InAppChannel,
        email: EmailChannel,
        webPush: WebPushChannel,
      ) => {
        const channels = [inApp, webPush];
        // Email only when a transactional-email provider key is present.
        if (config.get<string>('EMAIL_API_KEY')) channels.push(email);
        return channels;
      },
    },
  ],
})
export class AppModule {}
