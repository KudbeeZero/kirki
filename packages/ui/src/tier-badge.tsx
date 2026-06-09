import * as React from 'react';
import type { LeagueTierName } from '@simcoin/types';
import { cn } from './cn.js';

export interface TierBadgeProps {
  tier: LeagueTierName;
  /** Division within the tier (renders as I/II/III pips). */
  division?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const TIER_FILL: Record<LeagueTierName, string> = {
  bronze: 'hsl(var(--tier-bronze))',
  silver: 'hsl(var(--tier-silver))',
  gold: 'hsl(var(--tier-gold))',
  diamond: 'hsl(var(--tier-diamond))',
  master: 'hsl(var(--tier-master))',
};

const SIZES = { sm: 20, md: 32, lg: 56 } as const;

/**
 * League tier crest — a shield with a metallic gradient per tier and optional
 * division pips. Pure SVG, server-renderable. The crest reads instantly at a
 * glance on leaderboard rows and the profile header.
 */
export function TierBadge({ tier, division, size = 'md', showLabel, className }: TierBadgeProps) {
  const px = SIZES[size];
  const fill = TIER_FILL[tier];
  const gradId = `tier-${tier}`;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <svg width={px} height={px} viewBox="0 0 32 32" role="img" aria-label={`${tier} tier`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="35%" stopColor={fill} />
            <stop offset="100%" stopColor={fill} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <path
          d="M16 1 L29 6 V16 C29 24 23 29 16 31 C9 29 3 24 3 16 V6 Z"
          fill={`url(#${gradId})`}
          stroke="hsl(155 45% 12% / 0.6)"
          strokeWidth="1.5"
        />
        <path d="M16 8 l2.3 4.7 5.2 .8 -3.8 3.7 .9 5.2 -4.6 -2.4 -4.6 2.4 .9 -5.2 -3.8 -3.7 5.2 -.8 Z"
          fill="hsl(155 45% 12% / 0.55)" />
      </svg>
      {showLabel ? (
        <span className="font-display text-sm font-bold capitalize">
          {tier}
          {division ? ` ${'I'.repeat(Math.min(3, Math.max(1, division)))}` : ''}
        </span>
      ) : null}
    </span>
  );
}
