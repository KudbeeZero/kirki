import * as React from 'react';
import type { Decimal } from '@simcoin/types';
import { cn } from './cn.js';

export interface PriceTickerProps {
  /** Asset symbol, e.g. "BTC". */
  symbol: string;
  /** Current price. Prices cross the wire as decimal strings; numbers accepted. */
  price: Decimal | number;
  /** 24h change percent (e.g. "1.8" or -3.2). `null` renders a neutral dash. */
  change: Decimal | number | null;
  /** Optional human-readable asset name, e.g. "Bitcoin". */
  name?: string;
  className?: string;
}

function formatPrice(value: Decimal | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 6 : 2,
  });
}

function formatChange(pct: Decimal | number | null): {
  label: string;
  direction: 'up' | 'down' | 'flat';
} {
  if (pct === null) return { label: '—', direction: 'flat' };
  const n = typeof pct === 'number' ? pct : Number(pct);
  if (!Number.isFinite(n)) return { label: '—', direction: 'flat' };
  const direction = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return { label: `${n > 0 ? '+' : ''}${n.toFixed(2)}%`, direction };
}

/**
 * A compact live-price row: symbol, formatted price, and 24h change tinted
 * bull/bear. Presentational only — the parent owns subscription/polling and
 * passes fresh `price`/`change` values on each update.
 */
export function PriceTicker({ symbol, price, change, name, className }: PriceTickerProps) {
  const c = formatChange(change);
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md px-3 py-2',
        'bg-card/60',
        className,
      )}
      data-symbol={symbol}
    >
      <div className="flex flex-col">
        <span className="font-semibold">{symbol}</span>
        {name ? <span className="text-xs text-muted-foreground">{name}</span> : null}
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono tabular-nums">{formatPrice(price)}</span>
        <span
          className={cn(
            'text-xs font-medium',
            c.direction === 'up' && 'text-bull',
            c.direction === 'down' && 'text-bear',
            c.direction === 'flat' && 'text-muted-foreground',
          )}
        >
          {c.label}
        </span>
      </div>
    </div>
  );
}
