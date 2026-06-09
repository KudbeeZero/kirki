import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseService } from './database/database.service.js';
import { RedisService } from './redis/redis.service.js';
import { LeagueController } from './league/league.controller.js';
import { LeagueService } from './league/league.service.js';
import { SeasonRollJob } from './league/season-roll.job.js';

/** Root module for competition: leaderboards, seasons, and league tiers. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot()],
  controllers: [LeagueController],
  providers: [DatabaseService, RedisService, LeagueService, SeasonRollJob],
})
export class AppModule {}
