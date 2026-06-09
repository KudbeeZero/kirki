/**
 * Simcoin SDK client for the mobile app.
 *
 * Shares the exact same `@simcoin/sdk` and `@simcoin/types` as apps/web, so the
 * wire contract can never drift between clients. On native, the refresh token
 * should live in `expo-secure-store` (Keychain / Keystore); for this Phase-2
 * scaffold we use the SDK's in-memory provider.
 *
 * TODO (Phase 2): implement a SecureStore-backed TokenProvider and wire OAuth /
 * wallet connect, mirroring the web auth flow.
 */
import { SimcoinClient, MemoryTokenProvider } from '@simcoin/sdk';
import Constants from 'expo-constants';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000/api';

export const tokenProvider = new MemoryTokenProvider();

export const api = new SimcoinClient({
  baseUrl: API_BASE_URL,
  tokenProvider,
  defaultHeaders: { 'X-Simcoin-Client': 'mobile' },
});
