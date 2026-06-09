import type { UUID, Decimal, ISODateTime } from './index.js';
import type { LeagueTierName } from './auth.js';
export type LeaderboardScope = 'daily' | 'weekly' | 'monthly' | 'all_time' | 'season';
export interface Season {
    id: UUID;
    name: string;
    startsAt: ISODateTime;
    endsAt: ISODateTime;
    startingCash: Decimal;
    isActive: boolean;
}
export interface LeagueTier {
    name: LeagueTierName;
    /** Display ordering, bronze=0 … master=4. */
    rank: number;
    /** Fraction promoted/relegated at season end. */
    promoteTopPct: number;
    relegateBottomPct: number;
}
export interface LeagueMembership {
    seasonId: UUID;
    userId: UUID;
    tier: LeagueTierName;
    division: number;
    promoted: boolean | null;
}
export interface LeaderboardEntry {
    rank: number;
    userId: UUID;
    handle: string;
    avatarUrl: string | null;
    score: Decimal;
    tier: LeagueTierName;
}
export interface LeaderboardPage {
    scope: LeaderboardScope;
    periodKey: string;
    entries: LeaderboardEntry[];
    /** The requesting user's own row, even if outside the page. */
    me: LeaderboardEntry | null;
    total: number;
}
//# sourceMappingURL=competition.d.ts.map