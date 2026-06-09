/**
 * Shared motion language for @simcoin/ui. Keeping durations/easings/springs in
 * one place means every animated component feels like the same app. Mirrors the
 * CSS custom properties declared in the web app's globals.css.
 *
 * Pure data — no React, no framer import — so this module stays tree-shakeable
 * and server-safe. Animated components import these constants and pass them to
 * framer-motion `transition` props.
 */
import type { Transition, Variants } from 'framer-motion';

export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  celebrate: 0.7,
} as const;

/** iOS-flavoured ease-out, matches `--ease-out` in globals.css. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

/** The house spring — snappy but settled. Used for sheets, pills, pops. */
export const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 30 };
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 220, damping: 26 };

export const TRANSITION: Transition = { duration: DURATION.base, ease: EASE_OUT };

/** Fade + lift, for cards/sheets entering. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: TRANSITION },
};

/** Stagger container — children animate in sequence. */
export const staggerContainer = (stagger = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});

/** Press feedback for tappable surfaces (pair with whileTap). */
export const pressable = { scale: 0.96 } as const;
