/**
 * @simcoin/chain-icp — Internet Computer adapter.
 *
 * ICP is Simcoin's *fully on-chain assets* target: canisters can store the NFT
 * image/metadata bytes on-chain (not just a pointer to IPFS), so ICP is used for
 * premium, self-contained collectibles. NFTs follow the ICRC-7 standard, minted
 * via an asset canister. This package implements the shared {@link ChainAdapter}
 * contract so the NFT service can target ICP without importing any agent SDK.
 *
 * On-chain calls are deferred to phase 5 (`TODO(phase 5)`). Signature
 * verification on ICP differs from the L1s: callers authenticate with an
 * Internet Identity delegation rather than a raw Ed25519 wallet signature, so
 * the stub documents that path explicitly.
 */
import { NotImplementedException } from '@simcoin/shared';
import type { ChainAdapter, TokenId } from '@simcoin/shared';
import type { ChainKind } from '@simcoin/types';

export interface IcpAdapterConfig {
  /** Canister id of the ICRC-7 NFT/asset canister. */
  canisterId: string;
  /** Replica/gateway host, e.g. https://icp-api.io */
  host?: string;
  /** PEM/identity for the platform minting principal (server-side only). */
  minterIdentityPem?: string;
}

export class IcpAdapter implements ChainAdapter {
  readonly chain: ChainKind = 'icp';

  constructor(private readonly config: IcpAdapterConfig) {}

  /**
   * Mint an achievement NFT (ICRC-7) into the asset canister. `metadataUri`
   * points at metadata that the canister may inline on-chain. Returns the new
   * token's numeric id (as a string) within the canister.
   */
  async mintAchievement(_metadataUri: string): Promise<TokenId> {
    // TODO(phase 5): use @dfinity/agent (HttpAgent + Actor) to call the
    //   canister's `mint` method, await the update call, and return the
    //   token id from the canister response.
    throw new NotImplementedException('IcpAdapter.mintAchievement');
  }

  /**
   * Verify ownership for an ICP principal. ICP does not use raw wallet
   * signatures the way Algorand/Solana do — users authenticate via an Internet
   * Identity delegation chain. This method validates a delegation/`message`
   * proof for `address` (a textual principal).
   */
  async verifyWalletSignature(
    address: string,
    _message: string,
    _signature: string,
  ): Promise<boolean> {
    if (!isPlausiblePrincipal(address)) return false;
    // TODO(phase 5): verify the Internet Identity delegation chain in
    //   `signature` against `message` and confirm it resolves to the principal
    //   `address`, using @dfinity/identity / @dfinity/agent verification.
    throw new NotImplementedException('IcpAdapter.verifyWalletSignature');
  }

  /** Token URL on the ICP dashboard / canister gateway. */
  getExplorerUrl(tokenId: TokenId): string {
    return `https://dashboard.internetcomputer.org/canister/${this.config.canisterId}?token=${tokenId}`;
  }
}

/**
 * Cheap structural check for a textual ICP principal: lowercase base32 groups
 * of 5 separated by dashes, ending in a 3-char checksum group.
 */
export function isPlausiblePrincipal(principal: string): boolean {
  return /^([a-z0-9]{5}-)*[a-z0-9]{3}$/.test(principal);
}
