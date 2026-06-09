'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import type { UserAchievement } from '@simcoin/types';
import { Badge, CelebrationOverlay, ProgressRing } from '@simcoin/ui';

/**
 * Achievements gallery. Tiles render by status: unlocked (full colour + date),
 * in_progress (ProgressRing at `progress`), locked (grayscale + lock). Tapping
 * an unlocked tile replays its celebration. Typed mock data mirrors the seed
 * catalogue (see database/seeds/01_reference.sql).
 */
const ACHIEVEMENTS: UserAchievement[] = [
  {
    achievement: { id: 'a1', code: 'first_trade', name: 'First Trade', description: 'Place your first order.', icon: null, xpReward: 50 },
    status: 'unlocked',
    progress: 1,
    unlockedAt: '2026-05-02T12:00:00.000Z',
  },
  {
    achievement: { id: 'a2', code: 'hundred_trades', name: 'Centurion', description: 'Place 100 trades.', icon: null, xpReward: 300 },
    status: 'in_progress',
    progress: 0.87,
    unlockedAt: null,
  },
  {
    achievement: { id: 'a3', code: 'double_up', name: '100% Gain', description: 'Double your portfolio in a season.', icon: null, xpReward: 500 },
    status: 'in_progress',
    progress: 0.18,
    unlockedAt: null,
  },
  {
    achievement: { id: 'a4', code: 'top_100', name: 'Top 100 Finish', description: 'Finish a season ranked in the top 100.', icon: null, xpReward: 400 },
    status: 'locked',
    progress: 0,
    unlockedAt: null,
  },
];

export default function AchievementsPage() {
  const [celebrate, setCelebrate] = React.useState<UserAchievement | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-extrabold">Achievements</h1>
        <p className="text-sm text-muted-foreground">Earn XP and crests as you master the markets</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((ua) => {
          const { achievement: a, status, progress } = ua;
          const unlocked = status === 'unlocked';
          const locked = status === 'locked';
          return (
            <button
              key={a.id}
              disabled={!unlocked}
              onClick={() => unlocked && setCelebrate(ua)}
              className={[
                'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors',
                unlocked
                  ? 'border-primary/40 bg-primary/5'
                  : locked
                    ? 'border-border bg-card opacity-60'
                    : 'border-border bg-card',
              ].join(' ')}
            >
              <div className="relative">
                <ProgressRing value={unlocked ? 1 : progress} size={64} tone={unlocked ? 'lime' : 'gold'}>
                  {locked ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <span className="font-display text-base font-extrabold">
                      {unlocked ? '★' : `${Math.round(progress * 100)}%`}
                    </span>
                  )}
                </ProgressRing>
              </div>
              <p className="font-display text-sm font-bold leading-tight">{a.name}</p>
              <p className="text-[11px] leading-snug text-muted-foreground">{a.description}</p>
              <Badge variant={unlocked ? 'lime' : 'muted'} size="sm">
                +{a.xpReward} XP
              </Badge>
            </button>
          );
        })}
      </div>

      <CelebrationOverlay
        open={celebrate !== null}
        onDone={() => setCelebrate(null)}
        title={celebrate ? celebrate.achievement.name : ''}
        subtitle={celebrate ? `+${celebrate.achievement.xpReward} XP` : undefined}
      />
    </div>
  );
}
