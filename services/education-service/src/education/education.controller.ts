import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import {
  EducationService,
  type LessonCompletion,
  type LessonWithProgress,
} from './education.service.js';

/**
 * HTTP surface for lessons & learning progress (Phase 3). The caller's id, when
 * present, is forwarded by the gateway as `x-user-id` to annotate progress.
 */
@Controller('lessons')
export class EducationController {
  constructor(private readonly education: EducationService) {}

  /** List the lesson catalogue, annotated with the caller's progress. */
  @Get()
  list(@Headers('x-user-id') userId?: string): Promise<LessonWithProgress[]> {
    return this.education.listLessons(userId);
  }

  /** Fetch a single lesson by slug. */
  @Get(':slug')
  get(
    @Param('slug') slug: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<LessonWithProgress> {
    return this.education.getLesson(slug, userId);
  }

  /** Mark a lesson complete, awarding its XP. */
  @Post(':slug/complete')
  complete(
    @Param('slug') slug: string,
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: { score?: number },
  ): Promise<LessonCompletion> {
    return this.education.completeLesson(userId ?? '', slug, dto?.score);
  }
}
