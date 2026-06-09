'use client';

import { use, useEffect, useState } from 'react';
import { ApiError } from '@simcoin/sdk';
import type { Order, OrderSide, PlaceOrderRequest, PriceTick } from '@simcoin/types';
import { Button, Card, CardContent, CardHeader, CardTitle, PriceTicker } from '@simcoin/ui';
import { api } from '@/lib/api';

/**
 * Buy/sell panel for a single market.
 *
 * - Polls the latest price via `api.markets.price(symbol)`.
 * - Submits a market order via `api.trading.placeOrder` using USD `notional`
 *   so the engine derives quantity (see PlaceOrderRequest).
 *
 * TODO: subscribe to the live WebSocket tick instead of polling, and surface
 * the resulting fill (Order) plus updated portfolio cash once those feeds are
 * wired through the gateway.
 */
export default function TradePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const upper = symbol.toUpperCase();

  const [tick, setTick] = useState<PriceTick | null>(null);
  const [side, setSide] = useState<OrderSide>('buy');
  const [notional, setNotional] = useState('100');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const t = await api.markets.price(upper);
        if (active) setTick(t);
      } catch {
        /* not wired yet — leave previous tick */
      }
    }
    void poll();
    const id = setInterval(() => void poll(), 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [upper]);

  async function submit() {
    setError(null);
    setResult(null);
    setPending(true);
    const req: PlaceOrderRequest = {
      symbol: upper,
      side,
      type: 'market',
      notional,
    };
    try {
      const order: Order = await api.trading.placeOrder(req);
      setResult(`Order ${order.status}: ${order.side} ${order.symbol} (#${order.id.slice(0, 8)})`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not place order. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  const estPrice = tick ? Number(tick.price) : null;
  const estQty = estPrice && estPrice > 0 ? Number(notional) / estPrice : null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Trade {upper}</h1>
        <p className="text-sm text-muted-foreground">Market order · simulated balance</p>
      </header>

      <Card>
        <CardContent className="py-4">
          <PriceTicker
            symbol={upper}
            price={tick?.price ?? '0'}
            change={tick?.change24h ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Place order</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={side === 'buy' ? 'primary' : 'outline'}
              onClick={() => setSide('buy')}
              type="button"
            >
              Buy
            </Button>
            <Button
              variant={side === 'sell' ? 'destructive' : 'outline'}
              onClick={() => setSide('sell')}
              type="button"
            >
              Sell
            </Button>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Amount (USD)</span>
            <input
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              inputMode="decimal"
              value={notional}
              onChange={(e) => setNotional(e.target.value)}
            />
          </label>

          <p className="text-xs text-muted-foreground">
            {estQty !== null
              ? `≈ ${estQty.toFixed(6)} ${upper} at the current price`
              : 'Live price unavailable — estimate will appear once connected.'}
          </p>

          {result ? <p className="text-sm text-bull">{result}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            onClick={submit}
            disabled={pending || !notional}
            variant={side === 'buy' ? 'primary' : 'destructive'}
          >
            {pending ? 'Placing…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${upper}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
