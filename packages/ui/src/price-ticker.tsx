import * as React from 'react';
import type { PriceTick } from '@simcoin/types';
import { cn } from './cn.js';

export interface PriceTickerProps {
  /** Live price tick from the market service (prices cross the wire as strings). */
  tick: PriceTick;
  /** Optional human-readable asset name, e.g. "Bitcoin". */
  name?: string;
  className?: string;
}

function formatPrice(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 6 : 2,
  });
}

function formatChange(pct: string | null): { label: string; direction: 'up' | 'down' | 'flat' } {
  if (pct === null) return { label: '—', direction: 'flat' };
  const n = Number(pct);
  if (!Number.isFinite(n)) return { label: '—', direction: 'flat' };
  const direction = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return { label: `${n > 0 ? '+' : ''}${n.toFixed(2)}%`, direction };
}

/**
 * A compact live-price row: symbol, formatted price, and 24h change tinted
 * bull/bear. Presentational only — the parent owns subscription/polling and
 * passes a fresh {@link PriceTick} on each update.
 */
export function PriceTicker({ tick, name, className }: PriceTickerProps) {
  const change = formatChange(tick.change24h);
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md px-3 py-2',
        'bg-card/60',
        className,
      )}
      data-symbol={tick.symbol}
    >
      <div className="flex flex-col">
        <span className="font-semibold">{tick.symbol}</span>
        {name ? <span className="text-xs text-muted-foreground">{name}</span> : null}
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono tabular-nums">{formatPrice(tick.price)}</span>
        <span
          className={cn(
            'text-xs font-medium',
            change.direction === 'up' && 'text-bull',
            change.direction === 'down' && 'text-bear',
            change.direction === 'flat' && 'text-muted-foreground',
          )}
        >
          {change.label}
        </span>
      </div>
    </div>
  );
}
