import * as React from 'react';
import { cn } from './cn.js';

export interface StatProps {
  /** Caption above the value, e.g. "Portfolio Value". */
  label: string;
  /** Primary value, pre-formatted by the caller (e.g. "$104,230.18"). */
  value: React.ReactNode;
  /**
   * Optional delta shown beneath the value. A number is rendered as a signed
   * percent and tinted bull/bear; a string is rendered verbatim (neutral).
   */
  delta?: number | string | null;
  className?: string;
}

function renderDelta(delta: number | string): { label: string; tone: string } {
  if (typeof delta === 'string') return { label: delta, tone: 'text-muted-foreground' };
  const tone = delta > 0 ? 'text-bull' : delta < 0 ? 'text-bear' : 'text-muted-foreground';
  return { label: `${delta > 0 ? '+' : ''}${delta.toFixed(2)}%`, tone };
}

/**
 * A labelled metric tile with an optional signed delta. Presentational; the
 * caller formats `value` and supplies `delta` as a percent number or a string.
 */
export function Stat({ label, value, delta, className }: StatProps) {
  const d = delta === undefined || delta === null ? null : renderDelta(delta);
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {d ? <span className={cn('text-sm font-medium', d.tone)}>{d.label}</span> : null}
    </div>
  );
}
