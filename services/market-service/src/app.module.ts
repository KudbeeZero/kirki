import { Module, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { RedisService } from './redis/redis.service.js';
import { CoinGeckoProvider } from './market/coingecko.provider.js';
import { MarketController } from './market/market.controller.js';
import { MarketGateway } from './market/market.gateway.js';
import { MarketService } from './market/market.service.js';
import { PRICE_PROVIDER } from './market/price-provider.js';

/**
 * Root module. The {@link PRICE_PROVIDER} token is bound to CoinGecko by
 * default; swap the `useClass` here to plug in a different live feed without
 * touching ingestion, caching, or the gateway.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [MarketController],
  providers: [
    DatabaseService,
    RedisService,
    MarketGateway,
    MarketService,
    { provide: PRICE_PROVIDER, useClass: CoinGeckoProvider },
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly market: MarketService) {}

  onModuleInit(): void {
    this.market.startIngestion();
  }

  onModuleDestroy(): void {
    this.market.stopIngestion();
  }
}
