'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardEntry, LeaderboardPage, LeaderboardScope } from '@simcoin/types';
import { Badge, Card, CardContent, LeaderboardRow, SegmentedControl, TierBadge } from '@simcoin/ui';
import { api } from '@/lib/api';

/**
 * Competitive leaderboard. Scope is an animated SegmentedControl; the viewer's
 * own row is pinned below the list when it falls outside the page. Falls back to
 * typed mock data when the gateway isn't wired.
 */
const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'season', label: 'Season' },
];

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', handle: 'satoshigrind', avatarUrl: null, score: '34.82', tier: 'master' },
  { rank: 2, userId: 'u2', handle: 'degenduck', avatarUrl: null, score: '29.10', tier: 'diamond' },
  { rank: 3, userId: 'u3', handle: 'hodlqueen', avatarUrl: null, score: '24.55', tier: 'diamond' },
  { rank: 4, userId: 'u4', handle: 'paperhands', avatarUrl: null, score: '19.07', tier: 'gold' },
  { rank: 5, userId: 'u5', handle: 'rektrecovery', avatarUrl: null, score: '15.93', tier: 'gold' },
  { rank: 6, userId: 'u6', handle: 'meanreversion', avatarUrl: null, score: '12.40', tier: 'silver' },
];

const MOCK_ME: LeaderboardEntry = {
  rank: 42,
  userId: 'me',
  handle: 'you',
  avatarUrl: null,
  score: '8.41',
  tier: 'silver',
};

export default function LeaderboardPageView() {
  const [scope, setScope] = useState<LeaderboardScope>('weekly');
  const [page, setPage] = useState<LeaderboardPage>({
    scope: 'weekly',
    periodKey: 'mock',
    entries: MOCK_ENTRIES,
    me: MOCK_ME,
    total: MOCK_ENTRIES.length,
  });

  useEffect(() => {
    let active = true;
    api.leaderboards
      .page(scope, { limit: 50 })
      .then((p) => {
        if (active) setPage(p);
      })
      .catch(() => {
        /* offline / not wired — keep current (mock) page */
      });
    return () => {
      active = false;
    };
  }, [scope]);

  const me = page.me;
  const meInList = me ? page.entries.some((e) => e.userId === me.userId) : false;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-extrabold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Climb the leagues this season</p>
      </header>

      {/* Your league context */}
      {me ? (
        <Card className="bg-gradient-to-br from-card to-background-elevated">
          <CardContent className="flex items-center gap-3 py-4">
            <TierBadge tier={me.tier} division={2} size="lg" />
            <div className="flex-1">
              <p className="font-display font-bold capitalize">{me.tier} League · Div II</p>
              <p className="text-xs text-muted-foreground">
                Rank #{me.rank} · finish top 30% to promote
              </p>
            </div>
            <Badge variant="lime">{`+${Number(me.score).toFixed(1)}%`}</Badge>
          </CardContent>
        </Card>
      ) : null}

      <SegmentedControl options={SCOPES} value={scope} onChange={setScope} tone="lime" />

      <ul className="flex flex-col gap-1.5">
        {page.entries.map((entry) => (
          <li key={entry.userId}>
            <LeaderboardRow entry={entry} highlight={entry.userId === me?.userId} />
          </li>
        ))}
      </ul>

      {me && !meInList ? (
        <div className="sticky bottom-24 mt-2">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Your rank</p>
          <LeaderboardRow entry={me} highlight />
        </div>
      ) : null}
    </div>
  );
}
