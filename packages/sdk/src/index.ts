/**
 * @simcoin/sdk — typed client for the Simcoin public API.
 *
 * Consumed by apps/web, apps/mobile, and apps/admin. All request/response
 * shapes come from @simcoin/types so the client and server can never drift.
 */
export { SimcoinClient } from './client.js';
export type { SimcoinClientOptions } from './client.js';

export { HttpClient, ApiError, MemoryTokenProvider } from './http.js';
export type {
  TokenProvider,
  HttpClientOptions,
  RequestOptions,
  FetchLike,
} from './http.js';

export {
  AuthResource,
  MarketsResource,
  PortfolioResource,
  TradingResource,
  LeaderboardsResource,
  EducationResource,
} from './resources.js';
