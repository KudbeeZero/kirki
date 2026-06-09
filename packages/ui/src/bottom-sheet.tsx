'use client';
import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SPRING } from './motion.js';
import { cn } from './cn.js';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile bottom sheet: scrim + draggable panel that dismisses on swipe-down or
 * backdrop tap. Locks body scroll while open and closes on Escape. Honors
 * reduced-motion (fade instead of slide). The signature trade ticket lives in
 * one of these.
 */
export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative z-10 w-full max-w-screen-md rounded-t-3xl border-t border-border',
              'bg-background-elevated px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3 shadow-sheet',
              className,
            )}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={SPRING}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/40" />
            {title ? (
              <h2 className="mb-3 text-center font-display text-lg font-bold">{title}</h2>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
