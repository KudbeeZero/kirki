'use client';
import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, ArrowLeftRight, Flame, TrendingUp, Sparkles } from 'lucide-react';
import type { Portfolio, Position } from '@simcoin/types';
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  CardContent,
  CoinIcon,
  ProgressRing,
  Sparkline,
  TierBadge,
  motion as ui,
} from '@simcoin/ui';

// Typed mock data — TODO: replace with api.portfolio.get()/positions() once
// auth gating + gateway are wired (see backlog "apps/web dashboard").
const PORTFOLIO: Portfolio = {
  id: 'pf1',
  userId: 'u-alex',
  seasonId: 's1',
  cashBalance: '4250.00',
  startingValue: '10000.00',
  totalValue: '11842.55',
  pnlPct: '18.43',
  createdAt: '2026-06-01T00:00:00.000Z',
};

const POSITIONS: Position[] = [
  { id: 'p1', portfolioId: 'pf1', symbol: 'BTC', quantity: '0.0721', avgEntry: '61200.00', marketPrice: '64850.10', marketValue: '4675.69', unrealizedPnl: '263.18' },
  { id: 'p2', portfolioId: 'pf1', symbol: 'SOL', quantity: '18.4', avgEntry: '142.10', marketPrice: '157.62', marketValue: '2900.21', unrealizedPnl: '285.57' },
];

const POPULAR = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64850.1, change: 2.4, spark: [60, 61, 60.5, 62, 63, 62.5, 64.8] },
  { symbol: 'SOL', name: 'Solana', price: 157.62, change: 5.1, spark: [140, 145, 143, 150, 152, 156, 157.6] },
  { symbol: 'ETH', name: 'Ethereum', price: 3344.2, change: -1.2, spark: [3400, 3380, 3360, 3370, 3350, 3340, 3344] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.142, change: 0.6, spark: [0.139, 0.14, 0.141, 0.1395, 0.141, 0.1418, 0.142] },
];

const HERO_SPARK = [10.2, 10.8, 10.5, 11.1, 11.4, 11.2, 11.84]; // portfolio value trend
const SEASON_PROGRESS = 0.6; // 60% through the 30-day season
const SEASON_DAYS_LEFT = 12;

const usd = (n: number, max = 2) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: max });

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function DashboardView() {
  const pnl = Number(PORTFOLIO.pnlPct);
  const up = pnl >= 0;
  const profit = Number(PORTFOLIO.totalValue) - Number(PORTFOLIO.startingValue);

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={ui.staggerContainer(0.06)}
      initial="hidden"
      animate="show"
    >
      {/* Greeting */}
      <motion.header variants={ui.fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="font-display text-2xl font-extrabold">Alex :)</h1>
        </div>
        <Link href="/profile" aria-label="Your profile">
          <TierBadge tier="gold" division={2} size="lg" />
        </Link>
      </motion.header>

      {/* Hero balance */}
      <motion.div variants={ui.fadeUp}>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-background-elevated shadow-card">
          <CardContent className="flex items-start justify-between gap-4 py-5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Portfolio</p>
              <AnimatedNumber
                value={PORTFOLIO.totalValue}
                format={(n) => usd(n)}
                className="block font-display text-4xl font-extrabold tabular-nums"
              />
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={up ? 'bull' : 'bear'} size="sm">
                  {up ? '▲' : '▼'} {Math.abs(pnl).toFixed(2)}%
                </Badge>
                <span className={`text-sm font-medium ${up ? 'text-bull' : 'text-bear'}`}>
                  {up ? '+' : '−'}
                  {usd(Math.abs(profit))}
                </span>
              </div>
              <Sparkline points={HERO_SPARK} trend={up ? 'up' : 'down'} width={140} height={36} className="mt-3" />
            </div>
            <ProgressRing value={SEASON_PROGRESS} size={84} tone="gold">
              <span className="font-display text-lg font-bold">{SEASON_DAYS_LEFT}d</span>
              <span className="text-[10px] text-muted-foreground">left</span>
            </ProgressRing>
          </CardContent>
          <div className="flex gap-2 px-4 pb-4">
            <Button variant="white" size="pill" block>
              <Plus className="h-4 w-4" /> Add funds
            </Button>
            <Button variant="primary" size="pill" block>
              <ArrowLeftRight className="h-4 w-4" /> Trade
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Glance cards */}
      <motion.div variants={ui.fadeUp} className="grid grid-cols-3 gap-3">
        <GlanceCard icon={<TrendingUp className="h-4 w-4 text-bull" />} label="Today" value="+3.1%" tone="bull" />
        <GlanceCard icon={<Sparkles className="h-4 w-4 text-gold" />} label="XP today" value="+120" />
        <GlanceCard icon={<Flame className="h-4 w-4 text-gold" />} label="Streak" value="6d" />
      </motion.div>

      {/* Popular currencies */}
      <motion.section variants={ui.fadeUp} className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Popular Currencies</h2>
          <Link href="/markets" className="text-sm font-medium text-primary">
            See all
          </Link>
        </div>
        {POPULAR.map((c) => (
          <Link
            key={c.symbol}
            href={`/trade/${c.symbol}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 transition-colors active:bg-secondary/50"
          >
            <CoinIcon symbol={c.symbol} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{c.symbol}</p>
              <p className="truncate text-xs text-muted-foreground">{c.name}</p>
            </div>
            <Sparkline points={c.spark} trend={c.change >= 0 ? 'up' : 'down'} width={64} height={28} />
            <div className="w-24 text-right">
              <p className="font-mono text-sm tabular-nums">{usd(c.price, c.price < 1 ? 4 : 2)}</p>
              <p className={`text-xs font-medium ${c.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                {c.change >= 0 ? '+' : ''}
                {c.change.toFixed(2)}%
              </p>
            </div>
          </Link>
        ))}
      </motion.section>

      {/* Open positions */}
      <motion.section variants={ui.fadeUp} className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Open positions</h2>
        {POSITIONS.map((pos) => {
          const upnl = Number(pos.unrealizedPnl);
          return (
            <div
              key={pos.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3"
            >
              <CoinIcon symbol={pos.symbol} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{pos.symbol}</p>
                <p className="text-xs text-muted-foreground">
                  {pos.quantity} @ {usd(Number(pos.avgEntry))}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm tabular-nums">{usd(Number(pos.marketValue))}</p>
                <p className={`text-xs font-medium ${upnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {upnl >= 0 ? '+' : '−'}
                  {usd(Math.abs(upnl))}
                </p>
              </div>
            </div>
          );
        })}
      </motion.section>
    </motion.div>
  );
}

function GlanceCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'bull' | 'bear';
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-3 py-3">
      {icon}
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-display text-base font-bold ${tone === 'bull' ? 'text-bull' : ''}`}>
        {value}
      </span>
    </div>
  );
}
