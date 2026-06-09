/**
 * Blockchain adapter contract.
 *
 * The NFT service treats every chain (Algorand, Solana, ICP) through this one
 * narrow interface, so a new chain can be added by shipping a new
 * `@simcoin/chain-<name>` package that implements {@link ChainAdapter} — no
 * changes to the service itself. This indirection is the hard modularity
 * requirement: the service depends on the *contract* defined here, never on a
 * specific chain SDK.
 *
 * The interface is intentionally tiny: the three operations the NFT minting
 * flow actually needs. Chain-specific configuration (RPC endpoints, signer
 * keys) is the concern of each adapter's constructor, not of this contract.
 */
import type { ChainKind } from '@simcoin/types';

/** Opaque on-chain token identifier (ASA id, mint address, NFT id, …). */
export type TokenId = string;

/** Result of a successful mint. */
export interface MintResult {
  tokenId: TokenId;
  /** Transaction hash/id of the mint, for audit trails. */
  txId: string;
  chain: ChainKind;
}

/**
 * Common contract every chain integration implements. The NFT service holds a
 * `Record<ChainKind, ChainAdapter>` and dispatches by the user's chosen chain.
 */
export interface ChainAdapter {
  /** Which chain this adapter targets. */
  readonly chain: ChainKind;

  /**
   * Mint an achievement NFT whose metadata lives at `metadataUri`
   * (typically an IPFS/Arweave URI produced by the NFT service).
   * Resolves to the freshly minted token id.
   */
  mintAchievement(metadataUri: string): Promise<TokenId>;

  /**
   * Verify that `signature` over `message` was produced by the private key
   * controlling `address`. Used for wallet-login (proof of ownership) and to
   * authorise mints to a given wallet. Pure crypto — no network call.
   */
  verifyWalletSignature(
    address: string,
    message: string,
    signature: string,
  ): Promise<boolean>;

  /** Human-facing block-explorer URL for a token, for the UI to link to. */
  getExplorerUrl(tokenId: TokenId): string;
}

/**
 * Narrower contract for adapters that only mint (e.g. a server-side signer that
 * never verifies user wallets). {@link ChainAdapter} extends this shape.
 */
export interface ChainMinter {
  readonly chain: ChainKind;
  mintAchievement(metadataUri: string): Promise<TokenId>;
  getExplorerUrl(tokenId: TokenId): string;
}

/**
 * Thrown by adapter methods whose on-chain implementation is deferred.
 * Marks the seams where real chain calls will be wired up in phase 5.
 */
export class NotImplementedException extends Error {
  constructor(feature: string) {
    super(`Not implemented yet: ${feature}`);
    this.name = 'NotImplementedException';
  }
}
