import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { RedisService } from './redis/redis.service.js';
import { SocialController } from './social/social.controller.js';
import { SocialService } from './social/social.service.js';

/** Root module for the social graph & feed (Phase 2). */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [SocialController],
  providers: [DatabaseService, RedisService, SocialService],
})
export class AppModule {}
