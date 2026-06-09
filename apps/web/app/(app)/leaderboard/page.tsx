'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardEntry, LeaderboardPage, LeaderboardScope } from '@simcoin/types';
import { LeaderboardRow } from '@simcoin/ui';
import { api } from '@/lib/api';

/**
 * Competitive leaderboard. Players pick a scope (daily/weekly/…); the SDK
 * returns a page of ranked entries plus the viewer's own row (`me`) even when
 * it falls outside the page.
 *
 * TODO: paginate (offset) and add tier/division filters once the UI grows; for
 * now we show the top page and fall back to typed mock data when offline.
 */
const SCOPES: LeaderboardScope[] = ['daily', 'weekly', 'monthly', 'all_time', 'season'];

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', handle: 'satoshigrind', avatarUrl: null, score: '34.82', tier: 'master' },
  { rank: 2, userId: 'u2', handle: 'degenduck', avatarUrl: null, score: '29.10', tier: 'diamond' },
  { rank: 3, userId: 'u3', handle: 'hodlqueen', avatarUrl: null, score: '24.55', tier: 'diamond' },
  { rank: 4, userId: 'u4', handle: 'paperhands', avatarUrl: null, score: '19.07', tier: 'gold' },
  { rank: 5, userId: 'u5', handle: 'rektrecovery', avatarUrl: null, score: '15.93', tier: 'gold' },
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

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Climb the leagues this season</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={
              'whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors ' +
              (s === scope
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')
            }
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {page.entries.map((entry) => (
          <li key={entry.userId}>
            <LeaderboardRow entry={entry} highlight={entry.userId === page.me?.userId} />
          </li>
        ))}
      </ul>

      {page.me && !page.entries.some((e) => e.userId === page.me?.userId) ? (
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Your rank
          </p>
          <LeaderboardRow entry={page.me} highlight />
        </div>
      ) : null}
    </div>
  );
}
