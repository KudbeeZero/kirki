import * as React from 'react';
import type { LeaderboardEntry } from '@simcoin/types';
import { cn } from './cn.js';

export interface LeaderboardRowProps {
  /** A single ranked entry from the competition service. */
  entry: LeaderboardEntry;
  /** Highlight this row as the viewing user's own. */
  highlight?: boolean;
  className?: string;
}

const TIER_TONE: Record<LeaderboardEntry['tier'], string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  diamond: 'text-cyan-400',
  master: 'text-fuchsia-500',
};

function formatScore(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : value;
}

/**
 * One row of a leaderboard: rank, avatar/handle, tier badge, and score.
 * Presentational only — typed against the domain `LeaderboardEntry`.
 */
export function LeaderboardRow({ entry, highlight, className }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2',
        highlight ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-secondary/40',
        className,
      )}
      data-user-id={entry.userId}
      aria-current={highlight ? 'true' : undefined}
    >
      <span className="w-8 text-right font-mono tabular-nums text-muted-foreground">
        {entry.rank}
      </span>
      {entry.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.avatarUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="h-7 w-7 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
      )}
      <span className="flex-1 truncate font-medium">@{entry.handle}</span>
      <span className={cn('text-xs font-semibold uppercase', TIER_TONE[entry.tier])}>
        {entry.tier}
      </span>
      <span className="w-24 text-right font-mono tabular-nums">{formatScore(entry.score)}</span>
    </div>
  );
}
