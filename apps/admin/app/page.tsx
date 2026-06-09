'use client';

import { useState } from 'react';
import type { ISODateTime, Market, Season, User, UUID } from '@simcoin/types';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@simcoin/ui';
import { ADMIN_ENDPOINTS, api } from '@/lib/api';

/**
 * Admin operations console (single-page dashboard).
 *
 * Four UI shells, each wired against a planned admin endpoint (see
 * ADMIN_ENDPOINTS). The SDK has no `admin` namespace yet, so handlers use
 * `api.http` directly and are marked `// TODO` where live wiring is pending.
 * Data shown is typed mock data until the endpoints exist.
 */
export default function AdminDashboard() {
  return (
    <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Internal console · staff access only
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserSearch />
        <SeasonControls />
        <MarketToggles />
        <AuditLogViewer />
      </div>
    </main>
  );
}

// ── User search ──────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'satoshi@example.com',
    handle: 'satoshigrind',
    displayName: 'Satoshi',
    avatarUrl: null,
    role: 'player',
    isGuest: false,
    xp: 12480,
    currentTier: 'master',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: '2026-01-04T12:00:00.000Z',
  },
];

function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>(MOCK_USERS);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      // TODO: replace with `api.admin.users.search(query)` once the SDK exposes it.
      const users = await api.http.get<User[]>(ADMIN_ENDPOINTS.searchUsers(query));
      setResults(users);
    } catch {
      /* not wired yet — keep mock results */
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="handle, email, or id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void search()}
          />
          <Button size="sm" onClick={() => void search()} disabled={loading}>
            {loading ? '…' : 'Search'}
          </Button>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {results.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">@{u.handle}</p>
                <p className="text-xs text-muted-foreground">{u.email ?? 'no email'}</p>
              </div>
              <span className="text-xs uppercase text-muted-foreground">
                {u.role} · {u.currentTier}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Season controls ──────────────────────────────────────────────────────────

const MOCK_SEASON: Season = {
  id: 's1',
  name: 'Season 1 — Genesis',
  startsAt: '2026-06-01T00:00:00.000Z',
  endsAt: '2026-06-30T23:59:59.000Z',
  startingCash: '10000.00',
  isActive: true,
};

function SeasonControls() {
  const [season] = useState<Season>(MOCK_SEASON);
  const [busy, setBusy] = useState(false);

  async function startNew() {
    setBusy(true);
    try {
      // TODO: `api.admin.seasons.start(...)` — opens the next 30-day season.
      await api.http.post(ADMIN_ENDPOINTS.startSeason, { startingCash: '10000.00' });
    } catch {
      /* not wired yet */
    } finally {
      setBusy(false);
    }
  }

  async function endCurrent() {
    setBusy(true);
    try {
      // TODO: `api.admin.seasons.end(id)` — triggers promotion/relegation + rewards.
      await api.http.post(ADMIN_ENDPOINTS.endSeason(season.id));
    } catch {
      /* not wired yet */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="rounded-md bg-secondary/40 p-3">
          <p className="font-medium">{season.name}</p>
          <p className="text-xs text-muted-foreground">
            {fmtDate(season.startsAt)} → {fmtDate(season.endsAt)} ·{' '}
            {season.isActive ? 'active' : 'ended'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => void endCurrent()} disabled={busy}>
            End season
          </Button>
          <Button size="sm" onClick={() => void startNew()} disabled={busy}>
            Start next season
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Market toggles ───────────────────────────────────────────────────────────

const MOCK_MARKETS: Market[] = [
  { id: 'm-btc', symbol: 'BTC', name: 'Bitcoin', quoteCcy: 'USD', decimals: 8, isActive: true },
  { id: 'm-eth', symbol: 'ETH', name: 'Ethereum', quoteCcy: 'USD', decimals: 8, isActive: true },
  { id: 'm-doge', symbol: 'DOGE', name: 'Dogecoin', quoteCcy: 'USD', decimals: 8, isActive: false },
];

function MarketToggles() {
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);

  async function toggle(symbol: string) {
    setMarkets((prev) =>
      prev.map((m) => (m.symbol === symbol ? { ...m, isActive: !m.isActive } : m)),
    );
    try {
      // TODO: `api.admin.markets.toggle(symbol)` — enable/disable trading.
      await api.http.post(ADMIN_ENDPOINTS.toggleMarket(symbol));
    } catch {
      /* not wired yet — optimistic local toggle stands */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market toggles</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {markets.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium">{m.symbol}</span>{' '}
                <span className="text-xs text-muted-foreground">{m.name}</span>
              </div>
              <Button
                size="sm"
                variant={m.isActive ? 'primary' : 'outline'}
                onClick={() => void toggle(m.symbol)}
              >
                {m.isActive ? 'Active' : 'Disabled'}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Audit log ────────────────────────────────────────────────────────────────

/**
 * Local shape for an audit entry. TODO: promote to `@simcoin/types` once the
 * admin/audit bounded context is defined server-side.
 */
interface AuditLogEntry {
  id: UUID;
  actor: string;
  action: string;
  target: string | null;
  at: ISODateTime;
}

const MOCK_AUDIT: AuditLogEntry[] = [
  { id: 'a1', actor: 'admin:dom', action: 'market.toggle', target: 'DOGE', at: '2026-06-08T14:21:00.000Z' },
  { id: 'a2', actor: 'admin:dom', action: 'season.start', target: 'Season 1', at: '2026-06-01T00:00:00.000Z' },
  { id: 'a3', actor: 'system', action: 'user.ban', target: '@spambot42', at: '2026-05-30T09:05:00.000Z' },
];

function AuditLogViewer() {
  const [entries] = useState<AuditLogEntry[]>(MOCK_AUDIT);
  // TODO: load via `api.http.get<AuditLogEntry[]>(ADMIN_ENDPOINTS.auditLog)`.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{e.action}</p>
                <p className="text-xs text-muted-foreground">
                  {e.actor}
                  {e.target ? ` → ${e.target}` : ''}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{fmtDate(e.at)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function fmtDate(iso: ISODateTime): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}
