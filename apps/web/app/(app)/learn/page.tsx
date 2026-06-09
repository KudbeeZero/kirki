'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lesson, LessonProgress } from '@simcoin/types';
import { Card, CardContent } from '@simcoin/ui';
import { api } from '@/lib/api';

/**
 * Education hub: lessons grouped by module, each annotated with the viewer's
 * completion state and XP reward.
 *
 * TODO: deep-link each lesson to a reader/quiz route and call
 * `api.education.complete(lessonId, score)` on finish. For now tapping a lesson
 * is a no-op; data falls back to typed mocks when the API is unreachable.
 */
const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', slug: 'what-is-a-market', title: 'What is a market?', module: 'Foundations', ordering: 1, xpReward: 50 },
  { id: 'l2', slug: 'order-types', title: 'Market vs limit orders', module: 'Foundations', ordering: 2, xpReward: 75 },
  { id: 'l3', slug: 'reading-candles', title: 'Reading candlesticks', module: 'Charts', ordering: 1, xpReward: 100 },
  { id: 'l4', slug: 'risk-basics', title: 'Position sizing & risk', module: 'Risk', ordering: 1, xpReward: 120 },
];

const MOCK_PROGRESS: LessonProgress[] = [
  { lessonId: 'l1', completed: true, score: 1, completedAt: '2026-06-02T10:00:00.000Z' },
  { lessonId: 'l2', completed: true, score: 0.8, completedAt: '2026-06-03T10:00:00.000Z' },
];

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
  const [progress, setProgress] = useState<LessonProgress[]>(MOCK_PROGRESS);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.education.lessons(), api.education.progress()]).then(
      ([lessonsRes, progressRes]) => {
        if (!active) return;
        if (lessonsRes.status === 'fulfilled' && lessonsRes.value.length) {
          setLessons(lessonsRes.value);
        }
        if (progressRes.status === 'fulfilled') setProgress(progressRes.value);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const doneById = useMemo(
    () => new Map(progress.map((p) => [p.lessonId, p])),
    [progress],
  );

  const byModule = useMemo(() => {
    const groups = new Map<string, Lesson[]>();
    for (const lesson of [...lessons].sort((a, b) => a.ordering - b.ordering)) {
      const list = groups.get(lesson.module) ?? [];
      list.push(lesson);
      groups.set(lesson.module, list);
    }
    return [...groups.entries()];
  }, [lessons]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Learn</h1>
        <p className="text-sm text-muted-foreground">Earn XP as you master the markets</p>
      </header>

      {byModule.map(([module, items]) => (
        <section key={module} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{module}</h2>
          {items.map((lesson) => {
            const done = doneById.get(lesson.id)?.completed ?? false;
            return (
              <Card key={lesson.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                        (done
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground')
                      }
                      aria-hidden="true"
                    >
                      {done ? '✓' : lesson.ordering}
                    </span>
                    <span className="font-medium">{lesson.title}</span>
                  </div>
                  <span className="text-xs font-semibold text-accent">
                    +{lesson.xpReward} XP
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}
    </div>
  );
}
