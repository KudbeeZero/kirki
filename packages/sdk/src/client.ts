/**
 * SimcoinClient — the single entry point apps use to talk to the public API.
 *
 * Construct it once with a base URL and a {@link TokenProvider}, then reach the
 * API through typed namespaces:
 *
 * ```ts
 * const client = new SimcoinClient({
 *   baseUrl: 'https://api.simcoin.app',
 *   tokenProvider: new MemoryTokenProvider(),
 * });
 * await client.auth.login({ email, password });
 * const markets = await client.markets.list();
 * await client.trading.placeOrder({ symbol: 'BTC', side: 'buy', type: 'market', notional: '500' });
 * ```
 *
 * The client handles bearer-token attachment and automatic refresh-on-401
 * under the hood (see {@link HttpClient}).
 */
import { HttpClient } from './http.js';
import type { HttpClientOptions } from './http.js';
import {
  AuthResource,
  MarketsResource,
  PortfolioResource,
  TradingResource,
  LeaderboardsResource,
  EducationResource,
} from './resources.js';

export type SimcoinClientOptions = HttpClientOptions;

export class SimcoinClient {
  readonly http: HttpClient;
  readonly auth: AuthResource;
  readonly markets: MarketsResource;
  readonly portfolio: PortfolioResource;
  readonly trading: TradingResource;
  readonly leaderboards: LeaderboardsResource;
  readonly education: EducationResource;

  constructor(options: SimcoinClientOptions) {
    this.http = new HttpClient(options);
    this.auth = new AuthResource(this.http, options.tokenProvider);
    this.markets = new MarketsResource(this.http);
    this.portfolio = new PortfolioResource(this.http);
    this.trading = new TradingResource(this.http);
    this.leaderboards = new LeaderboardsResource(this.http);
    this.education = new EducationResource(this.http);
  }
}
