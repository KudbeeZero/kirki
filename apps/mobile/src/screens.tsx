/**
 * Placeholder screens for the Phase-2 mobile shell.
 *
 * Each screen imports the canonical domain shape it will eventually render from
 * `@simcoin/types` and shows typed mock data, so the navigation and types are
 * real ahead of full SDK wiring. Replace the mock arrays with `api.*` calls
 * (see ../src/api.ts) as each feature lands.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  LeaderboardEntry,
  Lesson,
  PriceTick,
  Position,
} from '@simcoin/types';

const COLORS = {
  bg: '#0a0f1e',
  card: '#121829',
  text: '#f8fafc',
  muted: '#94a3b8',
  bull: '#1bbf78',
  bear: '#ef4444',
  accent: '#a855f7',
};

function Screen({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.list}>{children}</View>
    </ScrollView>
  );
}

function Row({ left, sub, right, rightTone }: { left: string; sub?: string; right: string; rightTone?: string }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.rowLeft}>{left}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={[styles.rowRight, rightTone ? { color: rightTone } : null]}>{right}</Text>
    </View>
  );
}

// ── Markets ──────────────────────────────────────────────────────────────────
const MOCK_TICKS: PriceTick[] = [
  { symbol: 'BTC', price: '64850.10', change24h: '2.31', volume24h: null, ts: '' },
  { symbol: 'ETH', price: '3420.55', change24h: '-0.84', volume24h: null, ts: '' },
  { symbol: 'SOL', price: '157.62', change24h: '5.12', volume24h: null, ts: '' },
];

export function MarketsScreen() {
  return (
    <Screen title="Markets" subtitle="Live prices · simulated stakes">
      {MOCK_TICKS.map((t) => {
        const change = Number(t.change24h);
        return (
          <Row
            key={t.symbol}
            left={t.symbol}
            sub={`$${Number(t.price).toLocaleString()}`}
            right={`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
            rightTone={change >= 0 ? COLORS.bull : COLORS.bear}
          />
        );
      })}
    </Screen>
  );
}

// ── Portfolio ────────────────────────────────────────────────────────────────
const MOCK_POSITIONS: Position[] = [
  { id: 'p1', portfolioId: 'pf1', symbol: 'BTC', quantity: '0.072', avgEntry: '61200', marketPrice: '64850', marketValue: '4675.69', unrealizedPnl: '263.18' },
  { id: 'p2', portfolioId: 'pf1', symbol: 'SOL', quantity: '18.4', avgEntry: '142.10', marketPrice: '157.62', marketValue: '2900.21', unrealizedPnl: '285.57' },
];

export function PortfolioScreen() {
  return (
    <Screen title="Portfolio" subtitle="Season 1 · simulated balance">
      {MOCK_POSITIONS.map((p) => {
        const upnl = Number(p.unrealizedPnl);
        return (
          <Row
            key={p.id}
            left={p.symbol}
            sub={`${p.quantity} @ $${Number(p.avgEntry).toLocaleString()}`}
            right={`${upnl >= 0 ? '+' : ''}$${upnl.toFixed(2)}`}
            rightTone={upnl >= 0 ? COLORS.bull : COLORS.bear}
          />
        );
      })}
    </Screen>
  );
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', handle: 'satoshigrind', avatarUrl: null, score: '34.82', tier: 'master' },
  { rank: 2, userId: 'u2', handle: 'degenduck', avatarUrl: null, score: '29.10', tier: 'diamond' },
  { rank: 3, userId: 'u3', handle: 'hodlqueen', avatarUrl: null, score: '24.55', tier: 'diamond' },
];

export function LeaderboardScreen() {
  return (
    <Screen title="Leaderboard" subtitle="Climb the leagues this season">
      {MOCK_ENTRIES.map((e) => (
        <Row key={e.userId} left={`#${e.rank} @${e.handle}`} sub={e.tier} right={`+${e.score}%`} rightTone={COLORS.bull} />
      ))}
    </Screen>
  );
}

// ── Learn ────────────────────────────────────────────────────────────────────
const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', slug: 'what-is-a-market', title: 'What is a market?', module: 'Foundations', ordering: 1, xpReward: 50 },
  { id: 'l2', slug: 'order-types', title: 'Market vs limit orders', module: 'Foundations', ordering: 2, xpReward: 75 },
];

export function LearnScreen() {
  return (
    <Screen title="Learn" subtitle="Earn XP as you master the markets">
      {MOCK_LESSONS.map((l) => (
        <Row key={l.id} left={l.title} sub={l.module} right={`+${l.xpReward} XP`} rightTone={COLORS.accent} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 4 },
  h1: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 13, marginBottom: 12 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowLeft: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  rowRight: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
});
