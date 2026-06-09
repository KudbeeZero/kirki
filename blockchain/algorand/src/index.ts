/**
 * @simcoin/chain-algorand — Algorand adapter.
 *
 * Algorand is Simcoin's *primary* mint target: ~0.001 ALGO fees and instant
 * finality make it ideal for high-volume achievement badges (ASAs). This
 * package implements the shared {@link ChainAdapter} contract so the NFT
 * service can mint to Algorand without importing any Algorand SDK itself.
 *
 * On-chain calls are deferred to phase 5 and marked `TODO(phase 5)`. Wallet
 * signature verification is sketched against Algorand's real scheme (Ed25519
 * over the signing bytes, address = base32 of the public key + checksum) so it
 * can be completed without re-architecting.
 */
import { NotImplementedException } from '@simcoin/shared';
import type { ChainAdapter, TokenId } from '@simcoin/shared';
import type { ChainKind } from '@simcoin/types';

export interface AlgorandAdapterConfig {
  /** algod node URL, e.g. https://mainnet-api.algonode.cloud */
  algodUrl: string;
  /** API token for the algod node (empty for public nodes). */
  algodToken?: string;
  /** Mnemonic/handle of the platform minting account (server-side only). */
  minterMnemonic?: string;
  /** 'mainnet' | 'testnet' — selects the explorer base URL. */
  network?: 'mainnet' | 'testnet';
}

const EXPLORER_BASE: Record<'mainnet' | 'testnet', string> = {
  mainnet: 'https://explorer.perawallet.app/asset',
  testnet: 'https://testnet.explorer.perawallet.app/asset',
};

export class AlgorandAdapter implements ChainAdapter {
  readonly chain: ChainKind = 'algorand';
  private readonly network: 'mainnet' | 'testnet';

  constructor(private readonly config: AlgorandAdapterConfig) {
    this.network = config.network ?? 'mainnet';
  }

  /**
   * Mint an achievement as an Algorand Standard Asset (ARC-3/ARC-69 metadata
   * pointing at `metadataUri`) and return the new asset id as the token id.
   */
  async mintAchievement(_metadataUri: string): Promise<TokenId> {
    // TODO(phase 5): build + sign an asset-creation txn with algosdk,
    //   submit via algod, wait for confirmation, and return the created
    //   asset-index (ASA id) as a string TokenId.
    throw new NotImplementedException('AlgorandAdapter.mintAchievement');
  }

  /**
   * Verify an Algorand wallet signature: Ed25519 verify of `signature` over the
   * UTF-8 bytes of `message`, using the public key decoded from `address`
   * (Algorand addresses are base32(publicKey ++ 4-byte checksum)).
   */
  async verifyWalletSignature(
    address: string,
    _message: string,
    _signature: string,
  ): Promise<boolean> {
    if (!isPlausibleAlgorandAddress(address)) return false;
    // TODO(phase 5): decode the address to its 32-byte Ed25519 public key
    //   (algosdk.decodeAddress), base64-decode the signature, and call
    //   nacl.sign.detached.verify(messageBytes, sigBytes, publicKey).
    throw new NotImplementedException('AlgorandAdapter.verifyWalletSignature');
  }

  /** Pera explorer URL for an ASA id. */
  getExplorerUrl(tokenId: TokenId): string {
    return `${EXPLORER_BASE[this.network]}/${tokenId}`;
  }
}

/** Cheap structural check for an Algorand address (58 base32 chars). */
export function isPlausibleAlgorandAddress(address: string): boolean {
  return /^[A-Z2-7]{58}$/.test(address);
}
