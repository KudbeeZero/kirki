import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import type { OrderSide, OrderType, PlaceOrderRequest } from '@simcoin/types';

/** Decimal-as-string validator: digits with an optional fractional part. */
const DECIMAL = /^\d+(\.\d+)?$/;

/**
 * Validated body for `POST /orders`. Money fields are strings (the `Decimal`
 * wire type) and validated against {@link DECIMAL}; `quantity` and `notional`
 * are mutually exclusive — the service enforces the XOR after type validation.
 */
export class PlaceOrderDto implements PlaceOrderRequest {
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @IsIn(['buy', 'sell'])
  side!: OrderSide;

  @IsIn(['market', 'limit'])
  type!: OrderType;

  @IsOptional()
  @Matches(DECIMAL, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @IsOptional()
  @Matches(DECIMAL, { message: 'notional must be a decimal string' })
  notional?: string;

  @IsOptional()
  @Matches(DECIMAL, { message: 'limitPrice must be a decimal string' })
  limitPrice?: string;
}
