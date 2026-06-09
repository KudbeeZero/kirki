import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ChainMinter, TokenId } from './chain-minter.js';

/**
 * Default, off-chain {@link ChainMinter}.
 *
 * "Minting" here means allocating a stable token id for a DB-backed badge; no
 * blockchain is touched. This is stage 1 (`db_badge`) of the progressive
 * tokenization path and the binding the service ships with until a real chain
 * adapter is plugged into the `CHAIN_MINTER` token.
 */
@Injectable()
export class DbBadgeMinter implements ChainMinter {
  /** Off-chain: no chain. */
  readonly chain = null;

  /** Allocate a deterministic-length token id for a DB badge. */
  async mint(_metadataUri: string): Promise<TokenId> {
    return `db_${randomUUID()}`;
  }

  /** DB badges link to the in-app collection view rather than an explorer. */
  getExplorerUrl(tokenId: TokenId): string {
    const base = process.env.AUTH_URL ?? 'http://localhost:3000';
    return `${base}/collection/${tokenId}`;
  }
}
