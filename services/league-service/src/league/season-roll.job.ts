import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeagueService } from './league.service.js';

/**
 * Scheduled season-roll job.
 *
 * Seasons run for 30 days; at each boundary the leaderboard is snapshotted and
 * promotions/relegations are applied. This job wakes once a day and asks the
 * domain service whether the active season has expired, delegating the actual
 * roll to {@link LeagueService.rollSeason}. Running daily (rather than on a
 * 30-day timer) makes the job resilient to restarts and clock drift.
 */
@Injectable()
export class SeasonRollJob {
  private readonly logger = new Logger(SeasonRollJob.name);

  constructor(private readonly league: LeagueService) {}

  /** Daily at midnight UTC: roll the season if the current one has ended. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async maybeRoll(): Promise<void> {
    try {
      const season = await this.league.getCurrentSeason();
      if (new Date(season.endsAt).getTime() > Date.now()) {
        return; // not yet due
      }
      this.logger.log(`Season '${season.name}' has ended — rolling.`);
      await this.league.rollSeason();
    } catch (err) {
      // TODO(phase-1): once rollSeason is implemented, surface failures to
      // alerting rather than only logging.
      this.logger.warn(`Season roll check failed: ${(err as Error).message}`);
    }
  }
}
