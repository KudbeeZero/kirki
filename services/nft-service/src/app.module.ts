import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { CHAIN_MINTER } from './nft/chain-minter.js';
import { DbBadgeMinter } from './nft/db-badge.minter.js';
import { NftController } from './nft/nft.controller.js';
import { NftService } from './nft/nft.service.js';

/**
 * Root module for progressive tokenization. The {@link CHAIN_MINTER} token is
 * bound to the off-chain {@link DbBadgeMinter} by default; swap the `useClass`
 * to a real `@simcoin/chain-<name>` adapter to graduate badges on-chain.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NftController],
  providers: [
    DatabaseService,
    NftService,
    { provide: CHAIN_MINTER, useClass: DbBadgeMinter },
  ],
})
export class AppModule {}
