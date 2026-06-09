import * as React from 'react';
import { cn } from './cn.js';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: 'lime' | 'gold' | 'mint';
  className?: string;
  /** Show the value as a label inside the track. */
  showValue?: boolean;
}

const TONE = {
  lime: 'bg-primary',
  gold: 'bg-gold',
  mint: 'bg-accent',
} as const;

/** Linear progress. Animates via `transform: scaleX` (GPU-cheap) on the fill. */
export function ProgressBar({ value, tone = 'lime', className, showValue }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div
        className={cn('h-full origin-left rounded-full transition-transform duration-500 ease-out', TONE[tone])}
        style={{ transform: `scaleX(${pct})`, width: '100%' }}
      />
      {showValue ? (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
          {Math.round(pct * 100)}%
        </span>
      ) : null}
    </div>
  );
}
