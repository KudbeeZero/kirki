import { Controller, Get, Headers, Query, UnauthorizedException } from '@nestjs/common';
import type {
  Portfolio,
  Position,
  PortfolioStats,
  Transaction,
  UUID,
} from '@simcoin/types';
import { PortfolioService } from './portfolio.service.js';

/**
 * HTTP surface for the caller's own portfolio.
 *
 * The authenticated user id is propagated by the API gateway as the
 * `x-user-id` header after it validates the bearer token (auth-service is the
 * token authority). Downstream services trust this header on the internal
 * network; never expose these ports publicly without the gateway in front.
 */
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  /** The caller's portfolio, marked to market. */
  @Get()
  get(@Headers('x-user-id') userId?: string): Promise<Portfolio> {
    return this.portfolio.getPortfolio(this.requireUser(userId));
  }

  /** The caller's open positions. */
  @Get('positions')
  positions(@Headers('x-user-id') userId?: string): Promise<Position[]> {
    return this.portfolio.getPositions(this.requireUser(userId));
  }

  /** Aggregate performance stats (win rate, best/worst trade, realised PnL). */
  @Get('stats')
  stats(@Headers('x-user-id') userId?: string): Promise<PortfolioStats> {
    return this.portfolio.getStats(this.requireUser(userId));
  }

  /** The caller's transaction ledger, newest first. */
  @Get('transactions')
  transactions(
    @Headers('x-user-id') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Transaction[]> {
    return this.portfolio.getTransactions(
      this.requireUser(userId),
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
    );
  }

  private requireUser(userId?: string): UUID {
    if (!userId) throw new UnauthorizedException('Missing authenticated user.');
    return userId;
  }
}
