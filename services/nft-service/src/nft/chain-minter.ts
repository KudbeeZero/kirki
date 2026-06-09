import type { ChainKind } from '@simcoin/types';

/** Injection token for the active {@link ChainMinter} implementation. */
export const CHAIN_MINTER = Symbol('CHAIN_MINTER');

/** Opaque token identifier (DB badge id, ASA id, mint address, …). */
export type TokenId = string;

/**
 * The one narrow contract the NFT service depends on for tokenization.
 *
 * Progressive rollout: the default binding is the {@link DbBadgeMinter}, which
 * "mints" a row in our own database. When the platform graduates to on-chain
 * badges, a `@simcoin/chain-<name>` adapter implementing this same interface is
 * bound to {@link CHAIN_MINTER} instead — no changes to the service. This mirrors
 * the `ChainMinter`/`ChainAdapter` contract in `@simcoin/shared`.
 */
export interface ChainMinter {
  /** Which chain this minter targets; `null` for the off-chain DB minter. */
  readonly chain: ChainKind | null;

  /**
   * Mint a badge/NFT for an achievement whose metadata lives at `metadataUri`.
   * @returns The freshly minted token id.
   */
  mint(metadataUri: string): Promise<TokenId>;

  /** Human-facing URL for a token (block explorer on-chain; app URL for DB). */
  getExplorerUrl(tokenId: TokenId): string;
}
