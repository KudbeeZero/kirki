import * as React from 'react';
import { cn } from './cn.js';

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: 'lime' | 'gold' | 'mint';
  children?: React.ReactNode;
  className?: string;
}

const TONE = {
  lime: 'hsl(var(--primary))',
  gold: 'hsl(var(--gold))',
  mint: 'hsl(var(--accent))',
} as const;

/**
 * Circular progress arc (e.g. season countdown). Pure SVG; the arc length is
 * driven by `stroke-dashoffset` with a CSS transition (transform-only animation
 * isn't possible for arcs, but dashoffset is cheap and smooth). Center slot for
 * a label.
 */
export function ProgressRing({
  value,
  size = 72,
  stroke = 6,
  tone = 'gold',
  children,
  className,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      {children ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </span>
      ) : null}
    </div>
  );
}
