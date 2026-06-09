-- ════════════════════════════════════════════════════════════════════════
-- Simcoin canonical database schema (PostgreSQL 16)
--
-- This file is the documented source of truth for the data model and is also
-- mounted into the local Postgres container as an init script. Production
-- changes are applied as forward-only files under database/migrations/.
--
-- Phase legend (see docs/roadmap.md):
--   [P1] MVP   [P2] Social   [P3] Education   [P4] Seasons   [P5] NFT
-- ════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email/handle

-- ── Enums ───────────────────────────────────────────────────────────────
CREATE TYPE auth_provider   AS ENUM ('email', 'google', 'x', 'wallet', 'guest');
CREATE TYPE order_side      AS ENUM ('buy', 'sell');
CREATE TYPE order_type      AS ENUM ('market', 'limit');
CREATE TYPE order_status    AS ENUM ('open', 'filled', 'partially_filled', 'cancelled', 'rejected');
CREATE TYPE txn_type        AS ENUM ('trade_buy', 'trade_sell', 'season_grant', 'reward', 'adjustment');
CREATE TYPE league_tier     AS ENUM ('bronze', 'silver', 'gold', 'diamond', 'master');
CREATE TYPE leaderboard_scope AS ENUM ('daily', 'weekly', 'monthly', 'all_time', 'season');
CREATE TYPE achievement_status AS ENUM ('locked', 'in_progress', 'unlocked');
CREATE TYPE nft_stage       AS ENUM ('db_badge', 'nft_badge', 'cosmetic', 'marketplace'); -- [P5] progressive rollout
CREATE TYPE chain_kind      AS ENUM ('algorand', 'solana', 'icp');

-- ════════════════════════════════════════════════════════════════════════
-- Identity & accounts                                                  [P1]
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         CITEXT UNIQUE,                       -- null for guest accounts
    handle        CITEXT UNIQUE NOT NULL,
    display_name  TEXT,
    avatar_url    TEXT,
    is_guest      BOOLEAN NOT NULL DEFAULT FALSE,
    xp            BIGINT  NOT NULL DEFAULT 0,          -- lifetime XP [P3]
    current_tier  league_tier NOT NULL DEFAULT 'bronze',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per linked sign-in method. A user may link several.
CREATE TABLE auth_identities (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider       auth_provider NOT NULL,
    provider_uid   TEXT NOT NULL,                      -- external subject id / wallet addr
    password_hash  TEXT,                               -- only for provider = 'email'
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_uid)
);

-- On-chain wallets a user has connected (optional; never required to play). [P1 connect / P5 use]
CREATE TABLE wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chain       chain_kind NOT NULL,
    address     TEXT NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (chain, address)
);

-- ════════════════════════════════════════════════════════════════════════
-- Markets & price data                                                 [P1]
-- ════════════════════════════════════════════════════════════════════════
-- The tradable universe. Phase 1: BTC, ETH, SOL, ALGO, ICP, DOGE.
CREATE TABLE markets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol      TEXT UNIQUE NOT NULL,                  -- 'BTC'
    name        TEXT NOT NULL,                         -- 'Bitcoin'
    quote_ccy   TEXT NOT NULL DEFAULT 'USD',
    coingecko_id TEXT,                                 -- provider mapping
    decimals    SMALLINT NOT NULL DEFAULT 8,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time-series of real, live prices ingested by market-service.
-- Hot reads are served from Redis; this table is the durable record / for charts.
CREATE TABLE market_data (
    symbol      TEXT NOT NULL REFERENCES markets(symbol) ON DELETE CASCADE,
    ts          TIMESTAMPTZ NOT NULL,
    price       NUMERIC(24, 8) NOT NULL,
    volume_24h  NUMERIC(24, 4),
    change_24h  NUMERIC(10, 4),                        -- percent
    PRIMARY KEY (symbol, ts)
);
CREATE INDEX market_data_recent_idx ON market_data (symbol, ts DESC);

-- ════════════════════════════════════════════════════════════════════════
-- Seasons                                                              [P4][P1]
-- ════════════════════════════════════════════════════════════════════════
-- Defined before portfolios because a portfolio references the season it
-- belongs to (seasonal resets create a fresh portfolio while preserving
-- history). Forward-only DDL must create referenced tables first.
CREATE TABLE seasons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,                        -- 'Season 1'
    starts_at    TIMESTAMPTZ NOT NULL,
    ends_at      TIMESTAMPTZ NOT NULL,
    starting_cash NUMERIC(24, 8) NOT NULL DEFAULT 100000,
    is_active    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_active_season_idx ON seasons (is_active) WHERE is_active;

-- ════════════════════════════════════════════════════════════════════════
-- Portfolios, positions, orders, transactions                         [P1]
-- ════════════════════════════════════════════════════════════════════════
-- A portfolio is a player's simulated account, scoped to a season so that
-- seasonal resets create a fresh portfolio while preserving history.   [P4]
CREATE TABLE portfolios (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id      UUID REFERENCES seasons(id) ON DELETE SET NULL,
    cash_balance   NUMERIC(24, 8) NOT NULL,            -- simulated USD
    starting_value NUMERIC(24, 8) NOT NULL,            -- for PnL baseline
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, season_id)
);

-- Current holding of one asset within a portfolio (aggregate of fills).
CREATE TABLE positions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol        TEXT NOT NULL REFERENCES markets(symbol),
    quantity      NUMERIC(24, 8) NOT NULL DEFAULT 0,
    avg_entry     NUMERIC(24, 8) NOT NULL DEFAULT 0,   -- cost basis
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (portfolio_id, symbol)
);

CREATE TABLE orders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol        TEXT NOT NULL REFERENCES markets(symbol),
    side          order_side  NOT NULL,
    type          order_type  NOT NULL,
    status        order_status NOT NULL DEFAULT 'open',
    quantity      NUMERIC(24, 8) NOT NULL,
    limit_price   NUMERIC(24, 8),                      -- null for market orders
    filled_qty    NUMERIC(24, 8) NOT NULL DEFAULT 0,
    avg_fill_price NUMERIC(24, 8),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_open_limit_idx ON orders (symbol, status) WHERE status = 'open';
CREATE INDEX orders_portfolio_idx  ON orders (portfolio_id, created_at DESC);

-- Immutable ledger. Every cash/asset movement is recorded here.
CREATE TABLE transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    order_id      UUID REFERENCES orders(id),
    symbol        TEXT REFERENCES markets(symbol),
    type          txn_type NOT NULL,
    quantity      NUMERIC(24, 8),                      -- asset qty (null for cash-only)
    price         NUMERIC(24, 8),
    cash_delta    NUMERIC(24, 8) NOT NULL,             -- +credit / -debit to cash_balance
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transactions_portfolio_idx ON transactions (portfolio_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════════
-- Leagues                                                              [P1]
-- ════════════════════════════════════════════════════════════════════════
-- Membership of a user in a tier for a given season.
CREATE TABLE leagues (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id    UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier         league_tier NOT NULL DEFAULT 'bronze',
    division     SMALLINT NOT NULL DEFAULT 1,          -- sub-group within a tier
    promoted     BOOLEAN,                              -- end-of-season outcome
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (season_id, user_id)
);

-- Denormalised leaderboard snapshot rows. Hot ranking lives in Redis
-- sorted sets; this table persists standings for history and audit.
CREATE TABLE leaderboards (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope        leaderboard_scope NOT NULL,
    season_id    UUID REFERENCES seasons(id) ON DELETE CASCADE,
    period_key   TEXT NOT NULL,                        -- e.g. '2026-06-09', '2026-W23'
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank         INTEGER NOT NULL,
    score        NUMERIC(24, 8) NOT NULL,              -- portfolio value / PnL %
    captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (scope, period_key, user_id)
);
CREATE INDEX leaderboards_lookup_idx ON leaderboards (scope, period_key, rank);

-- ════════════════════════════════════════════════════════════════════════
-- Achievements & NFTs                                                  [P1→P5]
-- ════════════════════════════════════════════════════════════════════════
-- Catalogue of earnable achievements (definitions).
CREATE TABLE achievements (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT UNIQUE NOT NULL,                 -- 'first_trade'
    name         TEXT NOT NULL,
    description  TEXT NOT NULL,
    icon         TEXT,
    xp_reward    INTEGER NOT NULL DEFAULT 0,
    criteria     JSONB NOT NULL,                       -- machine-checkable rule
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A user's progress toward / unlock of an achievement.
CREATE TABLE user_achievements (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    status         achievement_status NOT NULL DEFAULT 'in_progress',
    progress       NUMERIC(6, 4) NOT NULL DEFAULT 0,   -- 0..1
    unlocked_at    TIMESTAMPTZ,
    UNIQUE (user_id, achievement_id)
);

-- Tokenization record. Stage advances per the NFT rollout (db_badge first). [P5]
CREATE TABLE nfts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_achievement  UUID REFERENCES achievements(id),
    stage               nft_stage NOT NULL DEFAULT 'db_badge',
    chain               chain_kind,                    -- null until minted
    token_id            TEXT,                          -- on-chain id once minted
    metadata_uri        TEXT,
    minted_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════════
-- Social                                                               [P2]
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE friends (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'pending',        -- pending | accepted | blocked
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id <> friend_id)
);

CREATE TABLE posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    trade_ref   UUID REFERENCES transactions(id),      -- optional "I just traded" card
    like_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_feed_idx ON posts (created_at DESC);

CREATE TABLE comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON comments (post_id, created_at);

-- ════════════════════════════════════════════════════════════════════════
-- Education                                                            [P3]
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE lessons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         TEXT UNIQUE NOT NULL,                 -- 'what-is-bitcoin'
    title        TEXT NOT NULL,
    module       TEXT NOT NULL,                        -- 'Fundamentals' | 'Technical Analysis' ...
    ordering     INTEGER NOT NULL DEFAULT 0,
    body         JSONB NOT NULL,                       -- structured lesson content
    xp_reward    INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lesson_progress (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed    BOOLEAN NOT NULL DEFAULT FALSE,
    score        NUMERIC(6, 4),                        -- quiz score 0..1
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, lesson_id)
);

-- ════════════════════════════════════════════════════════════════════════
-- Triggers: keep updated_at fresh
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_touch   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER orders_touch  BEFORE UPDATE ON orders  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
