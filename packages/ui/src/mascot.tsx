import * as React from 'react';
import { cn } from './cn.js';

export type MascotMood = 'idle' | 'happy' | 'sad' | 'celebrate';

export interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

/**
 * The Simcoin mascot — a friendly green smiley coin (see docs/design/assets).
 * Pure inline SVG so it scales crisply and stays server-renderable; the eyes
 * and mouth change with `mood`. Animation (bounce on celebrate) is applied by
 * the caller via framer-motion to keep this component dependency-free.
 */
export function Mascot({ mood = 'idle', size = 96, className }: MascotProps) {
  const mouth =
    mood === 'sad'
      ? 'M40 66 Q50 56 60 66' // frown
      : mood === 'celebrate'
        ? 'M38 58 Q50 76 62 58' // big open smile
        : 'M40 60 Q50 70 60 60'; // smile
  const eyeY = mood === 'happy' || mood === 'celebrate' ? 44 : 46;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('select-none', className)}
      role="img"
      aria-label="Simcoin mascot"
    >
      <circle cx="50" cy="50" r="46" fill="hsl(96 78% 56%)" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(155 40% 18%)" strokeWidth="6" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="hsl(155 40% 22% / 0.5)" strokeWidth="3" />
      <circle cx="38" cy={eyeY} r="5" fill="hsl(155 45% 14%)" />
      <circle cx="62" cy={eyeY} r="5" fill="hsl(155 45% 14%)" />
      <path
        d={mouth}
        fill="none"
        stroke="hsl(155 45% 14%)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
