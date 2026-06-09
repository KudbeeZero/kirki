import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Candle, Market, PriceTick } from '@simcoin/types';
import { MarketService } from './market.service.js';

/**
 * Read-only HTTP surface for market data. Live updates flow over the
 * Socket.IO gateway (`/markets` namespace); these endpoints serve catalogue
 * data, the latest cached price, and historical candles for charting.
 */
@Controller('markets')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  /** List the tradable markets and their metadata. */
  @Get()
  list(): Market[] {
    return this.market.listMarkets();
  }

  /** Latest price for a single symbol (Redis-cached, provider fallback). */
  @Get(':symbol/price')
  price(@Param('symbol') symbol: string): Promise<PriceTick> {
    return this.market.getPrice(symbol);
  }

  /** Historical OHLC candles for charting. */
  @Get(':symbol/candles')
  candles(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: Candle['interval'],
    @Query('limit') limit?: string,
  ): Promise<Candle[]> {
    return this.market.getCandles(
      symbol,
      interval ?? '1h',
      limit ? Number(limit) : 100,
    );
  }
}
