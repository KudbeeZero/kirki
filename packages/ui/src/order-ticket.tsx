'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import type { OrderSide, PlaceOrderRequest } from '@simcoin/types';
import { SegmentedControl } from './segmented-control.js';
import { AnimatedNumber } from './animated-number.js';
import { CoinIcon } from './coin-icon.js';
import { Button } from './button.js';
import { useHaptics } from './hooks/use-haptics.js';
import { SPRING } from './motion.js';
import { cn } from './cn.js';

export interface OrderTicketProps {
  symbol: string;
  /** Live price (number); null while loading. */
  price: number | null;
  /** Optional symbol switcher chips. */
  symbols?: string[];
  onSymbolChange?: (symbol: string) => void;
  /** Place the order. Resolves on fill, throws with a message on failure. */
  onSubmit: (req: PlaceOrderRequest) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

const QUICK = [25, 50, 100, 250];

/**
 * The trade ticket — buy/sell against a live price with USD notional. Lives in
 * a BottomSheet. Slippage-free in the sim, so the estimate is exact. On a
 * successful fill it shows a checkmark + haptic, then auto-closes.
 */
export function OrderTicket({
  symbol,
  price,
  symbols,
  onSymbolChange,
  onSubmit,
  onClose,
  className,
}: OrderTicketProps) {
  const [side, setSide] = React.useState<OrderSide>('buy');
  const [notional, setNotional] = React.useState('100');
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const haptics = useHaptics();

  const amount = Number(notional) || 0;
  const estQty = price && price > 0 ? amount / price : null;

  async function submit() {
    setError(null);
    setPending(true);
    haptics('medium');
    try {
      await onSubmit({ symbol, side, type: 'market', notional });
      haptics('success');
      setDone(true);
      setTimeout(() => onClose?.(), 1400);
    } catch (err) {
      haptics('error');
      setError(err instanceof Error ? err.message : 'Could not place order.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Asset + price */}
      <div className="flex items-center gap-3">
        <CoinIcon symbol={symbol} />
        <div className="flex-1">
          <p className="font-display text-lg font-bold leading-tight">{symbol}</p>
          <p className="text-xs text-muted-foreground">Market order · simulated</p>
        </div>
        {price !== null ? (
          <AnimatedNumber
            value={price}
            format={(n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: price < 1 ? 4 : 2 })}
            className="font-mono text-lg font-semibold tabular-nums"
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      {symbols && symbols.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {symbols.map((s) => (
            <button
              key={s}
              onClick={() => onSymbolChange?.(s)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                s === symbol
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground',
              )}
            >
              <CoinIcon symbol={s} size="sm" className="!h-4 !w-4 !text-[8px]" />
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <SegmentedControl<OrderSide>
        options={[
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell' },
        ]}
        value={side}
        onChange={setSide}
        tone={side === 'buy' ? 'lime' : 'gold'}
      />

      {/* Amount */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Amount (USD)</label>
        <input
          inputMode="decimal"
          value={notional}
          onChange={(e) => setNotional(e.target.value.replace(/[^0-9.]/g, ''))}
          className="h-12 w-full rounded-xl border border-input bg-background px-4 font-mono text-lg tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => setNotional(String(q))}
              className="flex-1 rounded-full bg-muted py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              ${q}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {estQty !== null ? (
          <>
            ≈{' '}
            <span className="font-mono tabular-nums text-foreground">
              {estQty.toLocaleString('en-US', { maximumFractionDigits: 6 })}
            </span>{' '}
            {symbol}
          </>
        ) : (
          'Live price unavailable'
        )}
      </p>

      {error ? <p className="text-center text-sm text-bear">{error}</p> : null}

      <Button
        onClick={submit}
        disabled={pending || done || amount <= 0}
        variant={side === 'buy' ? 'bull' : 'bear'}
        size="lg"
        block
      >
        {done ? 'Done' : pending ? 'Placing…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
      </Button>

      {/* Success flourish */}
      <AnimatePresence>
        {done ? (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-t-3xl bg-background-elevated/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="h-10 w-10" strokeWidth={3} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
