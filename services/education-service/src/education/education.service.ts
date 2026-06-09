import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Lesson, LessonProgress, UUID } from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';

/** A lesson joined with the caller's progress, as returned to the UI. */
export interface LessonWithProgress extends Lesson {
  progress: LessonProgress | null;
}

/** Result of completing a lesson: XP awarded and any newly earned badge. */
export interface LessonCompletion {
  lessonId: UUID;
  xpAwarded: number;
  totalXp: number;
  badgeEarned: string | null;
}

/**
 * Education service (Phase 3).
 *
 * Owns lessons, per-user lesson progress, XP accrual, badges, and certificates.
 * Completing a lesson awards its XP once (idempotent) and may unlock a badge or
 * certificate when a module is finished.
 */
@Injectable()
export class EducationService {
  private readonly logger = new Logger(EducationService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * List the lesson catalogue (ordered by module then ordering), annotated with
   * the caller's progress when a user id is supplied.
   */
  async listLessons(userId?: UUID): Promise<LessonWithProgress[]> {
    const { rows } = await this.db.query<
      Lesson & {
        completed: boolean | null;
        score: number | null;
        completedAt: string | null;
      }
    >(
      `SELECT l.id, l.slug, l.title, l.module, l.ordering, l.xp_reward AS "xpReward",
              lp.completed, lp.score, lp.completed_at AS "completedAt"
         FROM lessons l
         LEFT JOIN lesson_progress lp
           ON lp.lesson_id = l.id AND lp.user_id = $1
        ORDER BY l.module, l.ordering`,
      [userId ?? null],
    );
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      module: r.module,
      ordering: r.ordering,
      xpReward: r.xpReward,
      progress:
        r.completed === null
          ? null
          : { lessonId: r.id, completed: r.completed, score: r.score, completedAt: r.completedAt },
    }));
  }

  /** Fetch a single lesson by slug (with the caller's progress). 404 if absent. */
  async getLesson(slug: string, userId?: UUID): Promise<LessonWithProgress> {
    const all = await this.listLessons(userId);
    const lesson = all.find((l) => l.slug === slug);
    if (!lesson) throw new NotFoundException(`Unknown lesson '${slug}'.`);
    return lesson;
  }

  /**
   * Mark a lesson complete for the caller, awarding its XP exactly once.
   * @param userId Caller. @param slug Lesson slug. @param score Quiz score 0..1.
   */
  async completeLesson(userId: UUID, slug: string, score?: number): Promise<LessonCompletion> {
    // TODO(phase-3): upsert lesson_progress (idempotent on already-complete),
    // credit users.xp by the lesson's xp_reward inside one transaction, then
    // evaluate module-completion badges/certificates. The read path above and
    // the lookup below are real; the write/award body is deferred to Phase 3.
    const { rows } = await this.db.query<{ id: UUID; xpReward: number }>(
      `SELECT id, xp_reward AS "xpReward" FROM lessons WHERE slug = $1`,
      [slug],
    );
    if (!rows[0]) throw new NotFoundException(`Unknown lesson '${slug}'.`);
    this.logger.debug(`complete ${slug} for ${userId} (score=${score ?? 'n/a'})`);
    throw new Error('NotImplemented: completeLesson — pending Phase-3 progress/XP schema');
  }
}
