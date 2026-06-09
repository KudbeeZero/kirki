import { BadRequestException, Controller, Get, Headers, Param, Query } from '@nestjs/common';
import type {
  LeaderboardPage,
  LeaderboardScope,
  LeagueMembership,
  Season,
} from '@simcoin/types';
import { LeagueService } from './league.service.js';

const SCOPES: LeaderboardScope[] = ['daily', 'weekly', 'monthly', 'all_time', 'season'];

/**
 * HTTP surface for competition data. The caller's user id (for "me" rows and
 * personal membership) is forwarded by the gateway as `x-user-id`.
 */
@Controller()
export class LeagueController {
  constructor(private readonly league: LeagueService) {}

  /** A page of the leaderboard for the given scope, plus the caller's own row. */
  @Get('leaderboards/:scope')
  leaderboard(
    @Param('scope') scope: string,
    @Headers('x-user-id') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<LeaderboardPage> {
    if (!SCOPES.includes(scope as LeaderboardScope)) {
      throw new BadRequestException(`Unknown scope '${scope}'.`);
    }
    return this.league.getLeaderboard(
      scope as LeaderboardScope,
      userId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
    );
  }

  /** The currently active season. */
  @Get('seasons/current')
  currentSeason(): Promise<Season> {
    return this.league.getCurrentSeason();
  }

  /** The caller's league membership (tier + division) this season. */
  @Get('leagues/me')
  myLeague(@Headers('x-user-id') userId?: string): Promise<LeagueMembership> {
    if (!userId) throw new BadRequestException('Missing authenticated user.');
    return this.league.getMyLeague(userId);
  }
}
