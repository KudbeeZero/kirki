-- Reference data: tradable markets, the genesis season, achievements,
-- and the starter education catalogue. Safe to run repeatedly (idempotent).

-- ── Markets (Phase 1 universe) ────────────────────────────────────────────
INSERT INTO markets (symbol, name, coingecko_id, decimals) VALUES
  ('BTC',  'Bitcoin',           'bitcoin',           8),
  ('ETH',  'Ethereum',          'ethereum',          8),
  ('SOL',  'Solana',            'solana',            6),
  ('ALGO', 'Algorand',          'algorand',          6),
  ('ICP',  'Internet Computer', 'internet-computer', 8),
  ('DOGE', 'Dogecoin',          'dogecoin',          8)
ON CONFLICT (symbol) DO NOTHING;

-- ── Genesis season (30 days, $100k starting cash) ─────────────────────────
INSERT INTO seasons (name, starts_at, ends_at, starting_cash, is_active)
VALUES ('Season 1', now(), now() + INTERVAL '30 days', 100000, TRUE)
ON CONFLICT DO NOTHING;

-- ── Achievements catalogue ────────────────────────────────────────────────
INSERT INTO achievements (code, name, description, xp_reward, criteria) VALUES
  ('first_trade',   'First Trade',     'Place your very first order.',            50,  '{"type":"trade_count","gte":1}'),
  ('hundred_trades','Centurion',       'Place 100 trades.',                       300, '{"type":"trade_count","gte":100}'),
  ('double_up',     '100% Gain',       'Double your portfolio in a single season.',500,'{"type":"season_return_pct","gte":100}'),
  ('top_100',       'Top 100 Finish',  'Finish a season ranked in the top 100.',  400, '{"type":"season_rank","lte":100}')
ON CONFLICT (code) DO NOTHING;

-- ── Education starter modules ─────────────────────────────────────────────
INSERT INTO lessons (slug, title, module, ordering, body, xp_reward) VALUES
  ('what-is-bitcoin', 'What is Bitcoin?',       'Fundamentals',       1, '{"sections":[]}', 25),
  ('what-is-a-wallet','What is a Wallet?',      'Fundamentals',       2, '{"sections":[]}', 25),
  ('technical-analysis','Technical Analysis 101','Technical Analysis', 1, '{"sections":[]}', 40),
  ('rsi',             'Reading the RSI',        'Technical Analysis', 2, '{"sections":[]}', 40),
  ('macd',            'Understanding MACD',     'Technical Analysis', 3, '{"sections":[]}', 40),
  ('risk-management', 'Risk Management',        'Strategy',           1, '{"sections":[]}', 50),
  ('defi',            'Intro to DeFi',          'Advanced',           1, '{"sections":[]}', 60),
  ('nfts',            'Understanding NFTs',     'Advanced',           2, '{"sections":[]}', 60)
ON CONFLICT (slug) DO NOTHING;
