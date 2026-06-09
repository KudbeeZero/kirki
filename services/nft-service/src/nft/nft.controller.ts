import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Nft, UUID } from '@simcoin/types';
import { GatewayAuthGuard } from './auth.guard.js';
import { NftService } from './nft.service.js';

/**
 * HTTP surface for badges / NFTs. The caller's id is forwarded by the gateway
 * as `x-user-id`; minting is additionally protected by {@link GatewayAuthGuard}.
 */
@Controller('nfts')
export class NftController {
  constructor(private readonly nft: NftService) {}

  /** List the caller's badges / NFTs. */
  @Get()
  list(@Headers('x-user-id') userId?: string): Promise<Nft[]> {
    return this.nft.listNfts(this.requireUser(userId));
  }

  /** Mint a badge for an unlocked achievement. Guarded. */
  @UseGuards(GatewayAuthGuard)
  @Post(':achievement/mint')
  mint(
    @Headers('x-user-id') userId: string | undefined,
    @Param('achievement') achievement: string,
  ): Promise<Nft> {
    return this.nft.mint(this.requireUser(userId), achievement);
  }

  private requireUser(userId?: string): UUID {
    if (!userId) throw new UnauthorizedException('Missing authenticated user.');
    return userId;
  }
}
