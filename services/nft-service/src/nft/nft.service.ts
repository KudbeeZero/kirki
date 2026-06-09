import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Nft, UUID } from '@simcoin/types';
import { CHAIN_MINTER, type ChainMinter } from './chain-minter.js';
import { DatabaseService } from '../database/database.service.js';

/**
 * NFT / progressive-tokenization service (Phase 5).
 *
 * Achievements graduate through stages: `db_badge` → `nft_badge` → `cosmetic`
 * → `marketplace`. The service depends only on the {@link ChainMinter} contract
 * (bound to the DB minter by default), so adding a chain is a new adapter, not
 * a service change.
 */
@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(CHAIN_MINTER) private readonly minter: ChainMinter,
  ) {}

  /** List the caller's owned badges / NFTs across all stages. */
  async listNfts(userId: UUID): Promise<Nft[]> {
    const { rows } = await this.db.query<Nft>(
      `SELECT id, user_id AS "userId", source_achievement_id AS "sourceAchievementId",
              stage, chain, token_id AS "tokenId", metadata_uri AS "metadataUri",
              minted_at AS "mintedAt"
         FROM nfts WHERE user_id = $1 ORDER BY minted_at DESC NULLS LAST`,
      [userId],
    );
    return rows;
  }

  /**
   * Mint a badge for an unlocked achievement. Verifies the caller has actually
   * unlocked it, delegates token allocation to the active {@link ChainMinter}
   * (DB by default), and records the resulting NFT row.
   *
   * @param userId Caller (route is guarded).
   * @param achievementCode The achievement to tokenize, e.g. `'first_trade'`.
   */
  async mint(userId: UUID, achievementCode: string): Promise<Nft> {
    const { rows } = await this.db.query<{ id: UUID; status: string }>(
      `SELECT a.id, ua.status
         FROM achievements a
         LEFT JOIN user_achievements ua
           ON ua.achievement_id = a.id AND ua.user_id = $1
        WHERE a.code = $2`,
      [userId, achievementCode],
    );
    const achievement = rows[0];
    if (!achievement) throw new NotFoundException(`Unknown achievement '${achievementCode}'.`);
    if (achievement.status !== 'unlocked') {
      throw new NotFoundException(`Achievement '${achievementCode}' is not unlocked.`);
    }

    // TODO(phase-5): build/pin the metadata document, then persist the NFT row
    // and emit an event. The minter dispatch below is real and stage-correct;
    // the metadata + persistence body is deferred until the Phase-5 schema.
    const metadataUri = `simcoin://achievement/${achievementCode}`;
    const tokenId = await this.minter.mint(metadataUri);
    this.logger.debug(
      `Minted ${achievementCode} for ${userId} via ${this.minter.chain ?? 'db'} → ${tokenId}`,
    );
    throw new Error('NotImplemented: mint persistence — pending Phase-5 nfts schema');
  }
}
