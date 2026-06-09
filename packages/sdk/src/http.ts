/**
 * The HTTP transport that every SDK namespace builds requests on.
 *
 * Responsibilities:
 *  - build URLs (base + path + query) and JSON bodies,
 *  - attach the bearer token from the {@link TokenProvider},
 *  - transparently refresh on a 401 and replay the request once,
 *  - turn non-2xx responses into a typed {@link ApiError}.
 *
 * It uses the global `fetch` (Node 18+, browsers, RN) and takes no runtime
 * dependencies. A custom `fetch` can be injected for tests or SSR.
 */
import type { AuthTokens } from '@simcoin/types';

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<Response>;

/**
 * Supplies and persists auth tokens. Apps implement this against their storage
 * (memory, localStorage, SecureStore, …). All methods may be async.
 */
export interface TokenProvider {
  /** Current access token, or null when logged out. */
  getAccessToken(): string | null | Promise<string | null>;
  /** Current refresh token, or null when none is available. */
  getRefreshToken(): string | null | Promise<string | null>;
  /** Persist a freshly issued token pair (after login or refresh). */
  setTokens(tokens: AuthTokens | null): void | Promise<void>;
}

/** A trivial in-memory provider, useful for servers, scripts, and tests. */
export class MemoryTokenProvider implements TokenProvider {
  private tokens: AuthTokens | null;
  constructor(initial: AuthTokens | null = null) {
    this.tokens = initial;
  }
  getAccessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }
  getRefreshToken(): string | null {
    return this.tokens?.refreshToken ?? null;
  }
  setTokens(tokens: AuthTokens | null): void {
    this.tokens = tokens;
  }
}

export interface HttpClientOptions {
  /** API origin, e.g. "https://api.simcoin.app". No trailing slash required. */
  baseUrl: string;
  tokenProvider: TokenProvider;
  /** Override the global fetch (tests, SSR). */
  fetch?: FetchLike;
  /** Extra headers sent on every request (e.g. an app version). */
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  /** Skip attaching the bearer token (used by login/register/refresh). */
  anonymous?: boolean;
  /** Internal: prevents infinite refresh recursion. */
  _isRetry?: boolean;
}

/** A structured error thrown for any non-2xx API response. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Stable machine code from the API error body, when present. */
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: TokenProvider;
  private readonly fetchImpl: FetchLike;
  private readonly defaultHeaders: Record<string, string>;
  /** De-dupes concurrent refreshes so a burst of 401s triggers one refresh. */
  private refreshing: Promise<boolean> | null = null;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokenProvider = options.tokenProvider;
    this.fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.defaultHeaders = options.defaultHeaders ?? {};
    if (!this.fetchImpl) {
      throw new Error('No fetch implementation available; pass options.fetch.');
    }
  }

  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, opts);
  }
  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...opts, body });
  }
  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, { ...opts, body });
  }
  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, opts);
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    if (!query) return url;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.append(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private async request<T>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
    };

    if (!opts.anonymous) {
      const token = await this.tokenProvider.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let body: string | undefined;
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }

    const res = await this.fetchImpl(this.buildUrl(path, opts.query), {
      method,
      headers,
      body,
      signal: opts.signal,
    });

    // Transparent refresh-on-401: refresh once, then replay the request.
    if (res.status === 401 && !opts.anonymous && !opts._isRetry) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(method, path, { ...opts, _isRetry: true });
      }
    }

    if (!res.ok) throw await this.toApiError(res);
    return this.parseBody<T>(res);
  }

  /** Refresh the access token using the stored refresh token. */
  private tryRefresh(): Promise<boolean> {
    // Collapse concurrent refreshes into a single in-flight promise.
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = await this.tokenProvider.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await this.fetchImpl(this.buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await this.tokenProvider.setTokens(null); // refresh expired → log out
        return false;
      }
      const tokens = await this.parseBody<AuthTokens>(res);
      await this.tokenProvider.setTokens(tokens);
      return true;
    } catch {
      return false;
    }
  }

  private async parseBody<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async toApiError(res: Response): Promise<ApiError> {
    let code = 'HTTP_ERROR';
    let message = `Request failed with status ${res.status}`;
    let details: unknown;
    try {
      const parsed = (await res.json()) as {
        error?: { code?: string; message?: string; details?: unknown };
      };
      if (parsed?.error) {
        code = parsed.error.code ?? code;
        message = parsed.error.message ?? message;
        details = parsed.error.details;
      }
    } catch {
      // non-JSON error body; keep defaults
    }
    return new ApiError(res.status, code, message, details);
  }
}
