import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { UUID } from '@simcoin/types';
import {
  NotificationService,
  type StoredNotification,
} from './notification.service.js';

/**
 * HTTP surface for the in-app notification inbox. The caller's id is forwarded
 * by the gateway as `x-user-id`.
 */
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  /** List the caller's in-app notifications, newest first. */
  @Get()
  list(
    @Headers('x-user-id') userId: string | undefined,
    @Query('limit') limit?: string,
  ): Promise<StoredNotification[]> {
    return this.notifications.list(this.requireUser(userId), limit ? Number(limit) : 50);
  }

  /** Mark notifications read. Body `{ ids? }`; omit `ids` to mark all read. */
  @Post('read')
  @HttpCode(200)
  markRead(
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: { ids?: string[] },
  ): Promise<{ updated: number }> {
    return this.notifications.markRead(this.requireUser(userId), dto?.ids);
  }

  private requireUser(userId?: string): UUID {
    if (!userId) throw new UnauthorizedException('Missing authenticated user.');
    return userId;
  }
}
