'use client';
import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mascot } from './mascot.js';
import { cn } from './cn.js';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Pull distance (px) required to trigger. */
  threshold?: number;
  className?: string;
}

/**
 * Touch pull-to-refresh wrapper. Only engages when the page is scrolled to the
 * top and the gesture is a downward pull; reveals a spinning mascot coin and
 * fires `onRefresh` past the threshold. No-ops under reduced-motion / non-touch.
 */
export function PullToRefresh({ onRefresh, children, threshold = 72, className }: PullToRefreshProps) {
  const reduce = useReducedMotion();
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (reduce || refreshing) return;
    if (window.scrollY > 0) return;
    startY.current = e.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, threshold * 1.5));
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= threshold) {
      setRefreshing(true);
      setPull(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const active = pull > 0 || refreshing;

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        style={{ height: pull, opacity: active ? 1 : 0 }}
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: pull * 4 }}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
          className="mt-2"
        >
          <Mascot mood="happy" size={32} />
        </motion.div>
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: startY.current === null ? 'transform 200ms' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
