import * as React from 'react';
import type { LeaderboardEntry } from '@simcoin/types';
import { Avatar } from './avatar.js';
import { TierBadge } from './tier-badge.js';
import { cn } from './cn.js';

export interface LeaderboardRowProps {
  /** A single ranked entry from the competition service. */
  entry: LeaderboardEntry;
  /** Highlight this row as the viewing user's own. */
  highlight?: boolean;
  className?: string;
}

function formatScore(value: string): string {
  const n = Number(value);
  return Number.isFinite(n)
    ? `${n >= 0 ? '+' : ''}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
    : value;
}

/** Medal tint for the top three ranks. */
const MEDAL = ['text-gold', 'text-tier-silver', 'text-tier-bronze'];

/**
 * One leaderboard row: rank (medal-tinted for top 3), avatar/handle, tier crest,
 * and PnL-% score. Presentational; typed against the domain `LeaderboardEntry`.
 */
export function LeaderboardRow({ entry, highlight, className }: LeaderboardRowProps) {
  const score = Number(entry.score);
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2.5',
        highlight ? 'bg-primary/10 ring-1 ring-primary/40' : 'bg-card hover:bg-secondary/40',
        className,
      )}
      data-user-id={entry.userId}
      aria-current={highlight ? 'true' : undefined}
    >
      <span
        className={cn(
          'w-7 text-right font-display text-sm font-bold tabular-nums',
          entry.rank <= 3 ? MEDAL[entry.rank - 1] : 'text-muted-foreground',
        )}
      >
        {entry.rank}
      </span>
      <Avatar src={entry.avatarUrl} handle={entry.handle} size="sm" />
      <span className="flex-1 truncate font-medium">@{entry.handle}</span>
      <TierBadge tier={entry.tier} size="sm" />
      <span
        className={cn(
          'w-20 text-right font-mono text-sm tabular-nums',
          score >= 0 ? 'text-bull' : 'text-bear',
        )}
      >
        {formatScore(entry.score)}
      </span>
    </div>
  );
}
