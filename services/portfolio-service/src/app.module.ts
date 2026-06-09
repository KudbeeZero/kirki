import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { RedisService } from './redis/redis.service.js';
import { PortfolioController } from './portfolio/portfolio.controller.js';
import { PortfolioService } from './portfolio/portfolio.service.js';

/** Root module for the portfolio read model. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [PortfolioController],
  providers: [DatabaseService, RedisService, PortfolioService],
})
export class AppModule {}
