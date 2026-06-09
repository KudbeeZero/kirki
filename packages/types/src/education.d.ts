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
    score: number | null;
    completedAt: ISODateTime | null;
}
//# sourceMappingURL=education.d.ts.map