/**
 * Simcoin API access for the web client.
 *
 * Responsibilities:
 *  - Construct a single {@link SimcoinClient} from `@simcoin/sdk`, pointed at the
 *    public API gateway.
 *  - Keep the short-lived **access token in memory only** (never in
 *    localStorage) — XSS can't exfiltrate what isn't persisted.
 *  - The long-lived **refresh token lives in an httpOnly, Secure cookie** set by
 *    the gateway, so JS can't read it. The SDK's transparent refresh-on-401
 *    posts to `/auth/refresh`, which the browser authenticates via that cookie,
 *    and the original request is replayed once.
 *
 * Token lifecycle:
 *   login/register  -> store access token in memory; refresh cookie set by server
 *   request 401     -> SDK refreshes (cookie) -> new access token -> retry once
 *   refresh 401     -> tokens cleared; the next guarded call surfaces ApiError 401
 *
 * Implementation note: the SDK talks to storage through a {@link TokenProvider}.
 * We implement one whose access token is held in a module-scoped variable and
 * whose *refresh* token is intentionally not exposed to JS — `getRefreshToken`
 * returns a sentinel so the SDK still attempts a refresh, and the browser
 * attaches the real httpOnly cookie on that request.
 */
import { SimcoinClient } from '@simcoin/sdk';
import type { TokenProvider, FetchLike } from '@simcoin/sdk';
import type { AuthResult, AuthTokens, User } from '@simcoin/types';

/**
 * Public gateway base URL. In the monorepo dev setup, services sit behind a
 * gateway; default to the local web origin's `/api` proxy. Override with
 * `NEXT_PUBLIC_API_URL` for staging/prod.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Sentinel returned by {@link WebTokenProvider.getRefreshToken}. The real
 * refresh token is in an httpOnly cookie we cannot read; returning a non-null
 * value lets the SDK proceed with its `/auth/refresh` call, where the browser
 * supplies the actual token via the cookie.
 */
const REFRESH_VIA_COOKIE = 'cookie';

/**
 * In-memory access-token store implementing the SDK {@link TokenProvider}.
 * Module-scoped so it is shared by every caller within a single tab, and wiped
 * on full reload (refresh then re-establishes the session from the cookie).
 */
class WebTokenProvider implements TokenProvider {
  private accessToken: string | null = null;
  private expiresAt: number | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * We never hold the refresh token in JS; it lives in an httpOnly cookie.
   * Return a sentinel so the SDK still attempts a refresh (the browser attaches
   * the real cookie), or null once we've explicitly logged out.
   */
  getRefreshToken(): string | null {
    return this.loggedOut ? null : REFRESH_VIA_COOKIE;
  }

  setTokens(tokens: AuthTokens | null): void {
    if (!tokens) {
      this.accessToken = null;
      this.expiresAt = null;
      this.loggedOut = true;
      return;
    }
    this.accessToken = tokens.accessToken;
    this.expiresAt = Date.parse(tokens.accessTokenExpiresAt);
    this.loggedOut = false;
  }

  /** True if we hold a token that has not yet expired (60s skew). */
  isFresh(): boolean {
    if (!this.accessToken || this.expiresAt === null) return false;
    return Date.now() < this.expiresAt - 60_000;
  }

  private loggedOut = false;
}

export const tokenProvider = new WebTokenProvider();

/**
 * A `fetch` that always sends credentials so the browser attaches the httpOnly
 * refresh cookie on cross-origin gateway calls (notably `/auth/refresh`).
 */
const credentialedFetch: FetchLike = (input, init) =>
  fetch(input, { ...init, credentials: 'include' });

/**
 * A single shared SDK client. Reach the API through its typed namespaces:
 * `api.auth`, `api.markets`, `api.portfolio`, `api.trading`,
 * `api.leaderboards`, `api.education`. The client attaches the in-memory bearer
 * token and transparently refreshes on a 401 (see HttpClient in the SDK).
 */
export const api = new SimcoinClient({
  baseUrl: API_BASE_URL,
  tokenProvider,
  fetch: credentialedFetch,
  defaultHeaders: { 'X-Simcoin-Client': 'web' },
});

/** Persist the access token returned by login/register into the memory store. */
export function adoptSession(result: AuthResult): User {
  tokenProvider.setTokens(result.tokens);
  return result.user;
}

/** Drop the in-memory token and ask the gateway to clear the refresh cookie. */
export async function signOut(): Promise<void> {
  await api.auth.logout(); // clears local tokens in a finally{} internally
}
