import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { RedisService } from './redis/redis.service.js';
import { TradingController } from './trading/trading.controller.js';
import { TradingService } from './trading/trading.service.js';

/** Root module for the paper-trading order engine. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [TradingController],
  providers: [DatabaseService, RedisService, TradingService],
})
export class AppModule {}
