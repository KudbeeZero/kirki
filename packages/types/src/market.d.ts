import type { UUID, Decimal, ISODateTime } from './index.js';
export interface Market {
    id: UUID;
    symbol: string;
    name: string;
    quoteCcy: string;
    decimals: number;
    isActive: boolean;
}
/** A single live price tick, distributed over WebSocket and cached in Redis. */
export interface PriceTick {
    symbol: string;
    price: Decimal;
    change24h: Decimal | null;
    volume24h: Decimal | null;
    ts: ISODateTime;
}
/** OHLC candle for charting. */
export interface Candle {
    symbol: string;
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
    open: Decimal;
    high: Decimal;
    low: Decimal;
    close: Decimal;
    volume: Decimal;
    ts: ISODateTime;
}
//# sourceMappingURL=market.d.ts.map