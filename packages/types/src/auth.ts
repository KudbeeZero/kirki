import type { UUID, ISODateTime } from './index.js';

export type AuthProvider = 'email' | 'google' | 'x' | 'wallet' | 'guest';
export type AppRole = 'player' | 'creator' | 'moderator' | 'admin';
export type ChainKind = 'algorand' | 'solana' | 'icp';
export type MfaMethod = 'totp' | 'webauthn';

/** Public-safe user profile. Never includes secrets or PII beyond email. */
export interface User {
  id: UUID;
  email: string | null;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: AppRole;
  isGuest: boolean;
  xp: number;
  currentTier: LeagueTierName;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: ISODateTime;
}

// Re-exported here to avoid a circular import in consumers.
export type LeagueTierName = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';

/** Short-lived bearer token claims (JWT payload). */
export interface AccessTokenClaims {
  sub: UUID; // user id
  role: AppRole;
  sid: UUID; // session id
  /** true once a second factor has been satisfied for this session */
  mfa: boolean;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  /** Opaque refresh token; the server stores only its hash. */
  refreshToken: string;
  accessTokenExpiresAt: ISODateTime;
  refreshTokenExpiresAt: ISODateTime;
}

export interface SessionInfo {
  id: UUID;
  userAgent: string | null;
  ip: string | null;
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
  current: boolean;
}

// ── Request payloads ────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  handle: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Required when the account has MFA enabled. */
  mfaCode?: string;
}

export interface OAuthLoginRequest {
  provider: Extract<AuthProvider, 'google' | 'x'>;
  /** Authorization code from the provider redirect. */
  code: string;
  redirectUri: string;
}

export interface WalletNonceRequest {
  chain: ChainKind;
  address: string;
}
export interface WalletNonceResponse {
  nonce: string;
  /** Human-readable message the wallet should sign. */
  message: string;
  expiresAt: ISODateTime;
}
export interface WalletVerifyRequest {
  chain: ChainKind;
  address: string;
  signature: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
export interface PasswordResetRequest {
  email: string;
}
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}
