import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  LeaderboardEntry,
  LeaderboardPage,
  LeaderboardScope,
  LeagueMembership,
  LeagueTier,
  Season,
  UUID,
} from '@simcoin/types';
import type { LeagueTierName } from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

/** Season length: leaderboards reset and tiers re-shuffle every 30 days. */
export const SEASON_LENGTH_DAYS = 30;

/**
 * The five league tiers, bronze (0) → master (4), with the promotion /
 * relegation bands applied at each season roll.
 */
export const LEAGUE_TIERS: readonly LeagueTier[] = [
  { name: 'bronze', rank: 0, promoteTopPct: 0.2, relegateBottomPct: 0 },
  { name: 'silver', rank: 1, promoteTopPct: 0.15, relegateBottomPct: 0.15 },
  { name: 'gold', rank: 2, promoteTopPct: 0.1, relegateBottomPct: 0.15 },
  { name: 'diamond', rank: 3, promoteTopPct: 0.05, relegateBottomPct: 0.15 },
  { name: 'master', rank: 4, promoteTopPct: 0, relegateBottomPct: 0.2 },
];

/** Redis sorted-set key for a leaderboard scope + period (e.g. a season id). */
const boardKey = (scope: LeaderboardScope, periodKey: string): string =>
  `leaderboard:${scope}:${periodKey}`;

/**
 * Competition domain service.
 *
 * Live rankings live in Redis sorted sets (O(log n) upsert, O(log n + k) range
 * read); the relational `leaderboards` table is the durable snapshot taken at
 * each season roll. Scores are JS numbers because sorted-set scores are IEEE-754
 * doubles by definition — this is ranking data, not money.
 */
@Injectable()
export class LeagueService {
  private readonly logger = new Logger(LeagueService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Read a page of a leaderboard from the live Redis sorted set, plus the
   * caller's own row (even when it falls outside the page).
   * @param scope Ranking window (daily/weekly/monthly/all_time/season).
   * @param userId Caller, for the "me" row. Optional.
   * @param limit Page size (default 50). @param offset Page offset.
   */
  async getLeaderboard(
    scope: LeaderboardScope,
    userId?: UUID,
    limit = 50,
    offset = 0,
  ): Promise<LeaderboardPage> {
    const periodKey = await this.currentPeriodKey(scope);
    const key = boardKey(scope, periodKey);

    // ZREVRANGE key offset (offset+limit-1) WITHSCORES — highest score first.
    const flat = await this.redis.publisher.zrevrange(
      key,
      offset,
      offset + limit - 1,
      'WITHSCORES',
    );
    const ids: UUID[] = [];
    const scores: string[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      ids.push(flat[i] as UUID);
      scores.push(flat[i + 1] as string);
    }
    const profiles = await this.hydrate(ids);
    const entries: LeaderboardEntry[] = ids.map((id, i) => ({
      rank: offset + i + 1,
      userId: id,
      handle: profiles[id]?.handle ?? id,
      avatarUrl: profiles[id]?.avatarUrl ?? null,
      score: scores[i]!,
      tier: profiles[id]?.tier ?? 'bronze',
    }));

    const total = await this.redis.publisher.zcard(key);
    const me = userId ? await this.entryFor(key, scope, periodKey, userId) : null;
    return { scope, periodKey, entries, me, total };
  }

  /** The currently active season, or 404 if none has been opened. */
  async getCurrentSeason(): Promise<Season> {
    const { rows } = await this.db.query<Season>(
      `SELECT id, name, starts_at AS "startsAt", ends_at AS "endsAt",
              starting_cash AS "startingCash", is_active AS "isActive"
         FROM seasons WHERE is_active = true
         ORDER BY starts_at DESC LIMIT 1`,
    );
    const season = rows[0];
    if (!season) throw new NotFoundException('No active season.');
    return season;
  }

  /** The caller's league membership (tier, division) in the active season. */
  async getMyLeague(userId: UUID): Promise<LeagueMembership> {
    const season = await this.getCurrentSeason();
    const { rows } = await this.db.query<LeagueMembership>(
      `SELECT season_id AS "seasonId", user_id AS "userId",
              tier, division, promoted
         FROM league_memberships
        WHERE season_id = $1 AND user_id = $2`,
      [season.id, userId],
    );
    const membership = rows[0];
    if (!membership) {
      // A user with no membership yet sits in the entry tier.
      return { seasonId: season.id, userId, tier: 'bronze', division: 1, promoted: null };
    }
    return membership;
  }

  /**
   * Upsert a user's score into the live leaderboard sorted sets. Called by the
   * event consumer when a `trade.executed` shifts a portfolio's value.
   * @param userId The competitor. @param score Portfolio value or PnL %.
   */
  async recordScore(userId: UUID, score: number): Promise<void> {
    for (const scope of ['daily', 'weekly', 'monthly', 'season', 'all_time'] as const) {
      const key = boardKey(scope, await this.currentPeriodKey(scope));
      await this.redis.publisher.zadd(key, score, userId);
    }
  }

  /**
   * Roll the season: snapshot the final leaderboard to `leaderboards`, apply
   * promotions/relegations per {@link LEAGUE_TIERS}, open the next 30-day
   * season, and publish `season.rolled`. Invoked by the scheduled job.
   */
  async rollSeason(): Promise<void> {
    // TODO(phase-1): implement snapshot → promote/relegate → open-next-season
    // within a single DB transaction, then publish REDIS_CHANNELS.seasons. The
    // tier bands and period math above are real; the orchestration body is
    // deferred until the leaderboards/seasons migrations land.
    this.logger.warn('rollSeason invoked but not yet implemented');
    throw new Error('NotImplemented: rollSeason — pending seasons/leaderboards schema');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Build the caller's own leaderboard row from their live rank + score. */
  private async entryFor(
    key: string,
    _scope: LeaderboardScope,
    _periodKey: string,
    userId: UUID,
  ): Promise<LeaderboardEntry | null> {
    const rank = await this.redis.publisher.zrevrank(key, userId);
    if (rank === null) return null;
    const score = (await this.redis.publisher.zscore(key, userId)) ?? '0';
    const [profile] = Object.values(await this.hydrate([userId]));
    return {
      rank: rank + 1,
      userId,
      handle: profile?.handle ?? userId,
      avatarUrl: profile?.avatarUrl ?? null,
      score,
      tier: profile?.tier ?? 'bronze',
    };
  }

  /** Resolve the period key for a scope (season id, ISO week/day, or 'all'). */
  private async currentPeriodKey(scope: LeaderboardScope): Promise<string> {
    if (scope === 'all_time') return 'all';
    if (scope === 'season') return (await this.getCurrentSeason()).id;
    const now = new Date();
    if (scope === 'daily') return now.toISOString().slice(0, 10); // YYYY-MM-DD
    if (scope === 'monthly') return now.toISOString().slice(0, 7); // YYYY-MM
    // weekly: ISO year-week.
    const week = Math.ceil(
      ((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7,
    );
    return `${now.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  /** Hydrate user display fields for a set of ids (handle, avatar, tier). */
  private async hydrate(
    ids: UUID[],
  ): Promise<Record<UUID, { handle: string; avatarUrl: string | null; tier: LeagueTierName }>> {
    if (ids.length === 0) return {};
    const { rows } = await this.db.query<{
      id: UUID;
      handle: string;
      avatarUrl: string | null;
      tier: LeagueTierName;
    }>(
      `SELECT id, handle, avatar_url AS "avatarUrl", current_tier AS "tier"
         FROM users WHERE id = ANY($1)`,
      [ids],
    );
    return Object.fromEntries(rows.map((r) => [r.id, r]));
  }
}
