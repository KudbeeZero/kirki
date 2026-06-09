'use client';
import * as React from 'react';
import { useSpring, useMotionValueEvent, useReducedMotion } from 'framer-motion';

export interface AnimatedNumberProps {
  /**
   * The value to display. **Accepts a Decimal string** (money is never a float
   * on the wire) — it's parsed to a number only to drive the tween; the
   * accessible label is formatted from the target so screen readers get the
   * settled value, not intermediate frames.
   */
  value: string | number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const defaultFormat = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

/**
 * Odometer-style number that rolls to its target. The big portfolio balance and
 * live estimates use this. transform/opacity-free (text only), and honors
 * reduced-motion by snapping instantly.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  prefix = '',
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const target = typeof value === 'number' ? value : Number(value);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const reduce = useReducedMotion();

  const spring = useSpring(safeTarget, reduce ? { duration: 0 } : { stiffness: 90, damping: 20 });
  const [text, setText] = React.useState(() => format(safeTarget));

  React.useEffect(() => {
    spring.set(safeTarget);
  }, [safeTarget, spring]);

  useMotionValueEvent(spring, 'change', (v) => setText(format(v)));

  return (
    <span className={className}>
      <span aria-hidden="true">
        {prefix}
        {text}
        {suffix}
      </span>
      <span className="sr-only">{`${prefix}${format(safeTarget)}${suffix}`}</span>
    </span>
  );
}
