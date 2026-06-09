/**
 * Simcoin SDK client for the admin console.
 *
 * The admin app talks to the same gateway as the web app but as a staff user.
 * Tokens are held with the SDK's {@link MemoryTokenProvider}; like the web
 * client, nothing is persisted to localStorage. Refresh is delegated to the
 * httpOnly cookie set by the gateway (our `fetch` sends credentials).
 *
 * NOTE: the SDK does not yet expose an `admin` namespace. The dashboard screens
 * reference the admin endpoints they *will* call via the `ADMIN_ENDPOINTS` map
 * below and use `api.http` directly for raw, typed requests until first-class
 * `api.admin.*` resources are added to @simcoin/sdk. Each call site is marked
 * with a `// TODO`.
 */
import { SimcoinClient, MemoryTokenProvider } from '@simcoin/sdk';
import type { FetchLike } from '@simcoin/sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const credentialedFetch: FetchLike = (input, init) =>
  fetch(input, { ...init, credentials: 'include' });

export const tokenProvider = new MemoryTokenProvider();

export const api = new SimcoinClient({
  baseUrl: API_BASE_URL,
  tokenProvider,
  fetch: credentialedFetch,
  defaultHeaders: { 'X-Simcoin-Client': 'admin' },
});

/**
 * Planned admin endpoints, kept here as the single source of truth for the UI
 * shells until they become typed `api.admin.*` resources in the SDK.
 */
export const ADMIN_ENDPOINTS = {
  searchUsers: (q: string) => `/admin/users?query=${encodeURIComponent(q)}`,
  seasons: '/admin/seasons',
  startSeason: '/admin/seasons/start',
  endSeason: (id: string) => `/admin/seasons/${encodeURIComponent(id)}/end`,
  auditLog: '/admin/audit-log',
  markets: '/admin/markets',
  toggleMarket: (symbol: string) => `/admin/markets/${encodeURIComponent(symbol)}/toggle`,
} as const;
