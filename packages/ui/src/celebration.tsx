'use client';
import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mascot } from './mascot.js';
import { SPRING } from './motion.js';
import { cn } from './cn.js';

export interface CelebrationOverlayProps {
  open: boolean;
  onDone: () => void;
  title: string;
  subtitle?: string;
  /** Optional badge/crest to scale in (e.g. a TierBadge or achievement icon). */
  badge?: React.ReactNode;
  className?: string;
}

const CONFETTI_COLORS = ['hsl(96 78% 56%)', 'hsl(42 88% 60%)', 'hsl(150 60% 60%)', 'hsl(190 80% 66%)'];

/**
 * Full-screen celebration for achievement unlocks / level-ups: scrim, a happy
 * mascot, the badge scaling in, and lime/gold confetti. Tap anywhere to
 * dismiss; auto-dismisses after the celebrate duration. Honors reduced-motion
 * (skips confetti + mascot bounce).
 */
export function CelebrationOverlay({
  open,
  onDone,
  title,
  subtitle,
  badge,
  className,
}: CelebrationOverlayProps) {
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [open, onDone]);

  const confetti = React.useMemo(
    () =>
      Array.from({ length: reduce ? 0 : 28 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
        rot: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [reduce],
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            'fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm',
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          {/* Confetti */}
          {confetti.map((c) => (
            <motion.span
              key={c.id}
              className="absolute top-0 h-2.5 w-2.5 rounded-[2px]"
              style={{ left: `${c.x}%`, backgroundColor: c.color }}
              initial={{ y: -20, opacity: 1, rotate: c.rot }}
              animate={{ y: '100vh', opacity: [1, 1, 0], rotate: c.rot + 360 }}
              transition={{ duration: 1.8, delay: c.delay, ease: 'easeIn' }}
            />
          ))}

          <motion.div
            initial={reduce ? { scale: 1 } : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING}
          >
            {badge ?? <Mascot mood="celebrate" size={120} />}
          </motion.div>

          <motion.div
            className="px-8 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-display text-2xl font-extrabold text-primary">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-foreground/80">{subtitle}</p> : null}
            <p className="mt-4 text-xs text-muted-foreground">Tap to continue</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
