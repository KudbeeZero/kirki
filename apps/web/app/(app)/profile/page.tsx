'use client';

import Link from 'next/link';
import { Settings, ChevronRight } from 'lucide-react';
import type { PortfolioStats, User } from '@simcoin/types';
import { Avatar, Badge, Card, CardContent, TierBadge, XPBar } from '@simcoin/ui';

/**
 * Player profile: identity, tier crest, lifetime XP/level, season stats, and an
 * achievements preview. Typed mock data for now (TODO: api.auth.me + stats).
 */
const ME: User = {
  id: 'u-alex',
  email: 'alex@simcoin.app',
  handle: 'alex',
  displayName: 'Alex',
  avatarUrl: null,
  role: 'player',
  isGuest: false,
  xp: 1480,
  currentTier: 'gold',
  emailVerified: true,
  mfaEnabled: false,
  createdAt: '2026-05-01T00:00:00.000Z',
};

const STATS: PortfolioStats = {
  totalTrades: 87,
  winRate: '0.62',
  bestTrade: '412.50',
  worstTrade: '-188.20',
  realizedPnl: '1842.55',
};

// XP curve mirrors @simcoin/game-engine: xpForLevel(L) = 100*(L-1)^2.
const XP_BASE = 100;
const levelFromXp = (xp: number) => 1 + Math.floor(Math.sqrt(xp / XP_BASE));
const xpForLevel = (l: number) => XP_BASE * (l - 1) ** 2;

const usd = (v: string) =>
  Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function ProfilePage() {
  const level = levelFromXp(ME.xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Profile</h1>
        <Link href="/profile" aria-label="Settings" className="text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      {/* Identity + tier crest */}
      <Card className="bg-gradient-to-br from-card to-background-elevated">
        <CardContent className="flex items-center gap-4 py-5">
          <Avatar src={ME.avatarUrl} handle={ME.handle} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-extrabold">{ME.displayName ?? ME.handle}</p>
            <p className="truncate text-sm text-muted-foreground">@{ME.handle}</p>
          </div>
          <TierBadge tier={ME.currentTier} division={2} size="lg" showLabel />
        </CardContent>
      </Card>

      {/* Lifetime XP */}
      <Card>
        <CardContent className="py-4">
          <XPBar
            level={level}
            xpIntoLevel={ME.xp - floor}
            xpForNextLevel={ceil - floor}
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {ME.xp.toLocaleString()} lifetime XP
          </p>
        </CardContent>
      </Card>

      {/* Season stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Win rate" value={`${Math.round(Number(STATS.winRate) * 100)}%`} tone="bull" />
        <StatCard label="Trades" value={String(STATS.totalTrades)} />
        <StatCard label="Best trade" value={usd(STATS.bestTrade)} tone="bull" />
        <StatCard label="Realized PnL" value={usd(STATS.realizedPnl)} tone="bull" />
      </section>

      {/* Achievements preview */}
      <Link
        href="/achievements"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 active:bg-secondary/50"
      >
        <div className="flex-1">
          <p className="font-display font-bold">Achievements</p>
          <p className="text-xs text-muted-foreground">2 unlocked · 2 in progress</p>
        </div>
        <Badge variant="gold">+800 XP</Badge>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'bull' }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 font-display text-lg font-bold tabular-nums ${tone === 'bull' ? 'text-bull' : ''}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
