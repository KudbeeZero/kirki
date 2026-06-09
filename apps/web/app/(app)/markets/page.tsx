'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Market, PriceTick } from '@simcoin/types';
import { PriceTicker } from '@simcoin/ui';
import { api } from '@/lib/api';

/**
 * Live markets list. Each row is a {@link PriceTicker} linking to the trade
 * screen for that symbol.
 *
 * Data flow:
 *  - On mount, load the market catalogue via `api.markets.list()`.
 *  - Poll `api.markets.price(symbol)` on an interval for fresh ticks.
 *    TODO: replace polling with the market-service WebSocket feed for true
 *    realtime once the gateway exposes it.
 *
 * Until the backend is reachable we fall back to typed mock data so the screen
 * renders in isolation.
 */
const FALLBACK_MARKETS: Market[] = [
  { id: 'm-btc', symbol: 'BTC', name: 'Bitcoin', quoteCcy: 'USD', decimals: 8, isActive: true },
  { id: 'm-eth', symbol: 'ETH', name: 'Ethereum', quoteCcy: 'USD', decimals: 8, isActive: true },
  { id: 'm-sol', symbol: 'SOL', name: 'Solana', quoteCcy: 'USD', decimals: 6, isActive: true },
  { id: 'm-algo', symbol: 'ALGO', name: 'Algorand', quoteCcy: 'USD', decimals: 6, isActive: true },
  { id: 'm-icp', symbol: 'ICP', name: 'Internet Computer', quoteCcy: 'USD', decimals: 8, isActive: true },
  { id: 'm-doge', symbol: 'DOGE', name: 'Dogecoin', quoteCcy: 'USD', decimals: 8, isActive: true },
];

const FALLBACK_PRICES: Record<string, PriceTick> = {
  BTC: tick('BTC', '64850.10', '2.31'),
  ETH: tick('ETH', '3420.55', '-0.84'),
  SOL: tick('SOL', '157.62', '5.12'),
  ALGO: tick('ALGO', '0.184302', '1.07'),
  ICP: tick('ICP', '11.93', '-3.40'),
  DOGE: tick('DOGE', '0.142010', '0.00'),
};

function tick(symbol: string, price: string, change24h: string | null): PriceTick {
  return { symbol, price, change24h, volume24h: null, ts: new Date().toISOString() };
}

const POLL_MS = 4000;

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>(FALLBACK_MARKETS);
  const [prices, setPrices] = useState<Record<string, PriceTick>>(FALLBACK_PRICES);

  useEffect(() => {
    let active = true;
    api.markets
      .list()
      .then((list) => {
        if (active && list.length) setMarkets(list);
      })
      .catch(() => {
        /* offline / not wired yet — keep fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function poll() {
      const results = await Promise.allSettled(
        markets.map((m) => api.markets.price(m.symbol)),
      );
      if (!active) return;
      setPrices((prev) => {
        const next = { ...prev };
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') next[markets[i]!.symbol] = r.value;
        });
        return next;
      });
    }
    void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [markets]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-sm text-muted-foreground">Live prices · tap to trade</p>
      </header>
      <ul className="flex flex-col gap-2">
        {markets.map((m) => {
          const t = prices[m.symbol];
          return (
            <li key={m.id}>
              <Link href={`/trade/${m.symbol}`} className="block">
                <PriceTicker
                  symbol={m.symbol}
                  name={m.name}
                  price={t?.price ?? '0'}
                  change={t?.change24h ?? null}
                  className="hover:bg-secondary/40"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
