import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { Order, UUID } from '@simcoin/types';
import { PlaceOrderDto } from './dto/place-order.dto.js';
import { TradingService } from './trading.service.js';

/**
 * HTTP surface for the order engine. The authenticated user id is forwarded by
 * the API gateway as `x-user-id`; these ports are internal-only.
 */
@Controller('orders')
export class TradingController {
  constructor(private readonly trading: TradingService) {}

  /** Place a market or limit order. */
  @Post()
  place(
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: PlaceOrderDto,
  ): Promise<Order> {
    return this.trading.placeOrder(this.requireUser(userId), dto);
  }

  /** Cancel an open order owned by the caller. */
  @Delete(':id')
  @HttpCode(200)
  cancel(
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
  ): Promise<{ id: UUID; status: 'cancelled' }> {
    return this.trading.cancelOrder(this.requireUser(userId), id);
  }

  /** List the caller's orders, optionally filtered by status. */
  @Get()
  list(
    @Headers('x-user-id') userId: string | undefined,
    @Query('status') status?: Order['status'],
  ): Promise<Order[]> {
    return this.trading.listOrders(this.requireUser(userId), status);
  }

  private requireUser(userId?: string): UUID {
    if (!userId) throw new UnauthorizedException('Missing authenticated user.');
    return userId;
  }
}
