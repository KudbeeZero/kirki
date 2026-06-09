'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from './progress-bar.js';
import { usePrev } from './hooks/use-prev.js';
import { cn } from './cn.js';

export interface XPBarProps {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** Total XP the current level spans. */
  xpForNextLevel: number;
  /** Fired once when `level` increases between renders. */
  onLevelUp?: (level: number) => void;
  className?: string;
}

/**
 * Lifetime XP progress toward the next level. Pops the level chip when the
 * level increases (and calls `onLevelUp` so the page can fire a celebration).
 */
export function XPBar({ level, xpIntoLevel, xpForNextLevel, onLevelUp, className }: XPBarProps) {
  const prevLevel = usePrev(level);
  React.useEffect(() => {
    if (prevLevel !== undefined && level > prevLevel) onLevelUp?.(level);
  }, [level, prevLevel, onLevelUp]);

  const pct = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={level}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary"
        >
          {level}
        </motion.span>
      </AnimatePresence>
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Level {level}</span>
          <span className="font-mono tabular-nums">
            {Math.round(xpIntoLevel)} / {Math.round(xpForNextLevel)} XP
          </span>
        </div>
        <ProgressBar value={pct} tone="lime" />
      </div>
    </div>
  );
}
