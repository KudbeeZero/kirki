/**
 * API resource namespaces. Each class wraps {@link HttpClient} and exposes
 * typed methods returning @simcoin/types shapes. They contain real request
 * building — paths, query params, and bodies — not stubs.
 */
import type {
  AuthResult,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  Market,
  PriceTick,
  Candle,
  Portfolio,
  Position,
  Order,
  Transaction,
  PlaceOrderRequest,
  PortfolioStats,
  LeaderboardPage,
  LeaderboardScope,
  Lesson,
  LessonProgress,
} from '@simcoin/types';
import type { HttpClient, TokenProvider } from './http.js';

/** Authentication & session lifecycle. */
export class AuthResource {
  constructor(
    private readonly http: HttpClient,
    private readonly tokens: TokenProvider,
  ) {}

  /** Register a new account; persists the issued token pair on success. */
  async register(req: RegisterRequest): Promise<AuthResult> {
    const result = await this.http.post<AuthResult>('/auth/register', req, {
      anonymous: true,
    });
    await this.tokens.setTokens(result.tokens);
    return result;
  }

  /** Log in with email/password (+ optional MFA code); persists tokens. */
  async login(req: LoginRequest): Promise<AuthResult> {
    const result = await this.http.post<AuthResult>('/auth/login', req, {
      anonymous: true,
    });
    await this.tokens.setTokens(result.tokens);
    return result;
  }

  /** Exchange the stored refresh token for a fresh pair. */
  async refresh(): Promise<AuthTokens> {
    const refreshToken = await this.tokens.getRefreshToken();
    const result = await this.http.post<AuthTokens>(
      '/auth/refresh',
      { refreshToken },
      { anonymous: true },
    );
    await this.tokens.setTokens(result);
    return result;
  }

  /** Revoke the current session server-side and clear local tokens. */
  async logout(): Promise<void> {
    try {
      await this.http.post<void>('/auth/logout');
    } finally {
      await this.tokens.setTokens(null);
    }
  }

  /** The currently authenticated user. */
  me(): Promise<User> {
    return this.http.get<User>('/auth/me');
  }
}

/** Tradable markets and price data. */
export class MarketsResource {
  constructor(private readonly http: HttpClient) {}

  /** List all active markets. */
  list(): Promise<Market[]> {
    return this.http.get<Market[]>('/markets');
  }

  /** A single market by symbol (e.g. "BTC"). */
  get(symbol: string): Promise<Market> {
    return this.http.get<Market>(`/markets/${encodeURIComponent(symbol)}`);
  }

  /** Latest price tick for a symbol. */
  price(symbol: string): Promise<PriceTick> {
    return this.http.get<PriceTick>(`/markets/${encodeURIComponent(symbol)}/price`);
  }

  /** OHLC candles for charting. */
  candles(symbol: string, interval: Candle['interval'], limit = 200): Promise<Candle[]> {
    return this.http.get<Candle[]>(`/markets/${encodeURIComponent(symbol)}/candles`, {
      query: { interval, limit },
    });
  }
}

/** The authenticated user's portfolio, positions, and history. */
export class PortfolioResource {
  constructor(private readonly http: HttpClient) {}

  /** Current active-season portfolio summary. */
  get(): Promise<Portfolio> {
    return this.http.get<Portfolio>('/portfolio');
  }

  /** Open positions, marked to market. */
  positions(): Promise<Position[]> {
    return this.http.get<Position[]>('/portfolio/positions');
  }

  /** Aggregate performance stats. */
  stats(): Promise<PortfolioStats> {
    return this.http.get<PortfolioStats>('/portfolio/stats');
  }

  /** Ledger of cash/position-affecting transactions, newest first. */
  transactions(limit = 50, before?: string): Promise<Transaction[]> {
    return this.http.get<Transaction[]>('/portfolio/transactions', {
      query: { limit, before },
    });
  }
}

/** Order placement and management. */
export class TradingResource {
  constructor(private readonly http: HttpClient) {}

  /** Place a market or limit order. */
  placeOrder(req: PlaceOrderRequest): Promise<Order> {
    return this.http.post<Order>('/orders', req);
  }

  /** List the user's orders, optionally filtered by status. */
  orders(status?: Order['status']): Promise<Order[]> {
    return this.http.get<Order[]>('/orders', { query: { status } });
  }

  /** Fetch a single order. */
  getOrder(id: string): Promise<Order> {
    return this.http.get<Order>(`/orders/${encodeURIComponent(id)}`);
  }

  /** Cancel an open order. */
  cancelOrder(id: string): Promise<Order> {
    return this.http.delete<Order>(`/orders/${encodeURIComponent(id)}`);
  }
}

/** Competitive leaderboards across scopes. */
export class LeaderboardsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * A page of the leaderboard for a scope. `periodKey` selects a specific
   * period (e.g. an ISO week) and defaults to the current one server-side.
   */
  page(
    scope: LeaderboardScope,
    opts: { limit?: number; offset?: number; periodKey?: string } = {},
  ): Promise<LeaderboardPage> {
    return this.http.get<LeaderboardPage>(`/leaderboards/${scope}`, {
      query: { limit: opts.limit ?? 50, offset: opts.offset ?? 0, periodKey: opts.periodKey },
    });
  }
}

/** Education catalogue and the user's lesson progress. */
export class EducationResource {
  constructor(private readonly http: HttpClient) {}

  /** All lessons, optionally filtered to one module. */
  lessons(module?: string): Promise<Lesson[]> {
    return this.http.get<Lesson[]>('/education/lessons', { query: { module } });
  }

  /** A single lesson by slug. */
  lesson(slug: string): Promise<Lesson> {
    return this.http.get<Lesson>(`/education/lessons/${encodeURIComponent(slug)}`);
  }

  /** The user's progress across lessons. */
  progress(): Promise<LessonProgress[]> {
    return this.http.get<LessonProgress[]>('/education/progress');
  }

  /** Mark a lesson complete with an optional quiz score (0..1). */
  complete(lessonId: string, score?: number): Promise<LessonProgress> {
    return this.http.post<LessonProgress>(
      `/education/lessons/${encodeURIComponent(lessonId)}/complete`,
      { score },
    );
  }
}
