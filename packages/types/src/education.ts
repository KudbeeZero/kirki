import type { UUID, ISODateTime } from './index.js';

export interface Lesson {
  id: UUID;
  slug: string;
  title: string;
  module: string;
  ordering: number;
  xpReward: number;
}

export interface LessonProgress {
  lessonId: UUID;
  completed: boolean;
  score: number | null; // 0..1
  completedAt: ISODateTime | null;
}
