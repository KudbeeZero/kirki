import * as React from 'react';
import { cn } from './cn.js';

export interface SparklineProps {
  /** Series values, oldest → newest. */
  points: number[];
  trend?: 'up' | 'down' | 'flat';
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Minimal SVG sparkline. Pure + server-renderable. Auto-colours bull/bear from
 * the series direction unless `trend` is given. Renders nothing for <2 points.
 */
export function Sparkline({
  points,
  trend,
  width = 96,
  height = 32,
  strokeWidth = 2,
  className,
}: SparklineProps) {
  if (points.length < 2) return <svg width={width} height={height} className={className} />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);
  const pad = strokeWidth;
  const usable = height - pad * 2;

  const d = points
    .map((p, i) => {
      const x = i * stepX;
      const y = pad + (1 - (p - min) / span) * usable;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const dir =
    trend ?? ((points.at(-1) ?? 0) >= (points[0] ?? 0) ? 'up' : 'down');
  const stroke =
    dir === 'up' ? 'hsl(var(--bull))' : dir === 'down' ? 'hsl(var(--bear))' : 'hsl(var(--muted-foreground))';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
