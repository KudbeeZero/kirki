import * as React from 'react';
import { cn } from './cn.js';

/** The Phase-1 tradable universe. */
export type CoinSymbol = 'BTC' | 'ETH' | 'SOL' | 'ALGO' | 'ICP' | 'DOGE';

/** Per-asset brand colour + glyph for the round coin chip in lists/tickers. */
const COINS: Record<CoinSymbol, { color: string; glyph: string }> = {
  BTC: { color: 'bg-[#f7931a]', glyph: '₿' },
  ETH: { color: 'bg-[#627eea]', glyph: 'Ξ' },
  SOL: { color: 'bg-[#14f195] text-black', glyph: 'S' },
  ALGO: { color: 'bg-black text-white', glyph: 'A' },
  ICP: { color: 'bg-[#29abe2]', glyph: '∞' },
  DOGE: { color: 'bg-[#c2a633] text-black', glyph: 'Ð' },
};

const SIZES = { sm: 'h-7 w-7 text-xs', md: 'h-10 w-10 text-base', lg: 'h-12 w-12 text-lg' } as const;

export interface CoinIconProps {
  symbol: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Round, coloured coin badge. Unknown symbols fall back to a neutral chip. */
export function CoinIcon({ symbol, size = 'md', className }: CoinIconProps) {
  const key = symbol.toUpperCase() as CoinSymbol;
  const coin = COINS[key];
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-display font-bold text-white',
        coin?.color ?? 'bg-muted text-muted-foreground',
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      {coin?.glyph ?? key.slice(0, 1)}
    </span>
  );
}
