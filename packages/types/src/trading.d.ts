import type { UUID, Decimal, ISODateTime } from './index.js';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
export type TxnType = 'trade_buy' | 'trade_sell' | 'season_grant' | 'reward' | 'adjustment';
export interface Portfolio {
    id: UUID;
    userId: UUID;
    seasonId: UUID | null;
    cashBalance: Decimal;
    startingValue: Decimal;
    /** Mark-to-market total (cash + positions) at the quoted prices. */
    totalValue: Decimal;
    /** Unrealised + realised PnL vs startingValue, as a percent. */
    pnlPct: Decimal;
    createdAt: ISODateTime;
}
export interface Position {
    id: UUID;
    portfolioId: UUID;
    symbol: string;
    quantity: Decimal;
    avgEntry: Decimal;
    marketPrice: Decimal;
    marketValue: Decimal;
    unrealizedPnl: Decimal;
}
export interface Order {
    id: UUID;
    portfolioId: UUID;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    status: OrderStatus;
    quantity: Decimal;
    limitPrice: Decimal | null;
    filledQty: Decimal;
    avgFillPrice: Decimal | null;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export interface Transaction {
    id: UUID;
    portfolioId: UUID;
    orderId: UUID | null;
    symbol: string | null;
    type: TxnType;
    quantity: Decimal | null;
    price: Decimal | null;
    cashDelta: Decimal;
    createdAt: ISODateTime;
}
export interface PlaceOrderRequest {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    /** Quantity of the asset; mutually exclusive with notional. */
    quantity?: Decimal;
    /** USD notional to spend/receive; the engine derives quantity. */
    notional?: Decimal;
    limitPrice?: Decimal;
}
export interface PortfolioStats {
    totalTrades: number;
    winRate: Decimal;
    bestTrade: Decimal;
    worstTrade: Decimal;
    realizedPnl: Decimal;
}
//# sourceMappingURL=trading.d.ts.map