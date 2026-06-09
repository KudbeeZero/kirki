/**
 * Cross-service domain events, published on Redis pub/sub channels.
 * Services depend on these contracts, never on each other's internals —
 * this is what keeps the system modular per the architecture principles.
 */
import type { UUID, Decimal, ISODateTime } from './index.js';
export type DomainEvent = {
    type: 'order.filled';
    payload: OrderFilledEvent;
} | {
    type: 'trade.executed';
    payload: TradeExecutedEvent;
} | {
    type: 'achievement.unlocked';
    payload: AchievementUnlockedEvent;
} | {
    type: 'season.rolled';
    payload: SeasonRolledEvent;
} | {
    type: 'price.tick';
    payload: PriceTickEvent;
} | {
    type: 'user.registered';
    payload: UserRegisteredEvent;
};
export interface OrderFilledEvent {
    orderId: UUID;
    portfolioId: UUID;
    userId: UUID;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: Decimal;
    price: Decimal;
    at: ISODateTime;
}
export interface TradeExecutedEvent extends OrderFilledEvent {
    realizedPnl: Decimal | null;
    tradeCount: number;
}
export interface AchievementUnlockedEvent {
    userId: UUID;
    achievementCode: string;
    xpReward: number;
    at: ISODateTime;
}
export interface SeasonRolledEvent {
    previousSeasonId: UUID;
    newSeasonId: UUID;
    at: ISODateTime;
}
export interface PriceTickEvent {
    symbol: string;
    price: Decimal;
    ts: ISODateTime;
}
export interface UserRegisteredEvent {
    userId: UUID;
    provider: string;
    at: ISODateTime;
}
export declare const REDIS_CHANNELS: {
    readonly priceTicks: "simcoin:price:ticks";
    readonly trades: "simcoin:trades";
    readonly achievements: "simcoin:achievements";
    readonly seasons: "simcoin:seasons";
};
//# sourceMappingURL=events.d.ts.map