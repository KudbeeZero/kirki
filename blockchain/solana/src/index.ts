/**
 * @simcoin/chain-solana — Solana adapter.
 *
 * Solana is Simcoin's *high-throughput* mint target: very high TPS and cheap
 * compressed NFTs (cNFTs via the Bubblegum program) make it the choice for big
 * batched drops and seasonal campaigns. This package implements the shared
 * {@link ChainAdapter} contract so the NFT service can target Solana without
 * importing any Solana SDK directly.
 *
 * On-chain calls are deferred to phase 5 (`TODO(phase 5)`). Wallet signature
 * verification is sketched against Solana's real scheme (Ed25519 over the
 * message bytes, address = base58 of the 32-byte public key).
 */
import { NotImplementedException } from '@simcoin/shared';
import type { ChainAdapter, TokenId } from '@simcoin/shared';
import type { ChainKind } from '@simcoin/types';

export interface SolanaAdapterConfig {
  /** RPC endpoint, e.g. https://api.mainnet-beta.solana.com */
  rpcUrl: string;
  /** Base58 secret key of the platform minting wallet (server-side only). */
  minterSecretKey?: string;
  /** Merkle tree address used for compressed-NFT mints. */
  merkleTree?: string;
  cluster?: 'mainnet-beta' | 'devnet';
}

export class SolanaAdapter implements ChainAdapter {
  readonly chain: ChainKind = 'solana';
  private readonly cluster: 'mainnet-beta' | 'devnet';

  constructor(private readonly config: SolanaAdapterConfig) {
    this.cluster = config.cluster ?? 'mainnet-beta';
  }

  /**
   * Mint an achievement as a compressed NFT (Metaplex Bubblegum) whose metadata
   * URI is `metadataUri`, returning the asset id as the token id.
   */
  async mintAchievement(_metadataUri: string): Promise<TokenId> {
    // TODO(phase 5): use @metaplex-foundation/mpl-bubblegum to mintV1 into the
    //   configured merkle tree, confirm the txn, and return the leaf asset id.
    throw new NotImplementedException('SolanaAdapter.mintAchievement');
  }

  /**
   * Verify a Solana wallet signature: Ed25519 verify of `signature` over the
   * UTF-8 bytes of `message`, with the public key being the base58-decoded
   * `address` (a Solana address *is* the 32-byte Ed25519 public key).
   */
  async verifyWalletSignature(
    address: string,
    _message: string,
    _signature: string,
  ): Promise<boolean> {
    if (!isPlausibleSolanaAddress(address)) return false;
    // TODO(phase 5): base58-decode `address` to the 32-byte public key,
    //   base58/base64-decode the signature, and call
    //   nacl.sign.detached.verify(messageBytes, sigBytes, publicKey).
    throw new NotImplementedException('SolanaAdapter.verifyWalletSignature');
  }

  /** Solana Explorer URL for an asset, cluster-qualified. */
  getExplorerUrl(tokenId: TokenId): string {
    const suffix = this.cluster === 'devnet' ? '?cluster=devnet' : '';
    return `https://explorer.solana.com/address/${tokenId}${suffix}`;
  }
}

/** Cheap structural check for a base58 Solana address (32–44 chars). */
export function isPlausibleSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
