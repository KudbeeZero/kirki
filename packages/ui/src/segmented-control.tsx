'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { SPRING } from './motion.js';
import { cn } from './cn.js';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Active-thumb tone. */
  tone?: 'lime' | 'gold' | 'card';
  className?: string;
}

const THUMB_TONE = {
  lime: 'bg-primary',
  gold: 'bg-gold',
  card: 'bg-background-elevated',
} as const;

const TEXT_TONE = {
  lime: 'text-primary-foreground',
  gold: 'text-gold-foreground',
  card: 'text-foreground',
} as const;

/**
 * iOS-style segmented control with an animated sliding thumb (shared
 * `layoutId`). Used for buy/sell and leaderboard scopes. A unique `layoutId`
 * per instance prevents thumbs from animating across separate controls.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tone = 'card',
  className,
}: SegmentedControlProps<T>) {
  const id = React.useId();
  return (
    <div
      role="tablist"
      className={cn('inline-flex w-full gap-1 rounded-full bg-muted p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition-colors',
              active ? TEXT_TONE[tone] : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-thumb-${id}`}
                transition={SPRING}
                className={cn('absolute inset-0 rounded-full', THUMB_TONE[tone])}
              />
            ) : null}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
