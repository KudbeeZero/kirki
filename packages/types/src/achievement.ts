import type { UUID, ISODateTime, ChainKind } from './index.js';

export type AchievementStatus = 'locked' | 'in_progress' | 'unlocked';
/** Progressive NFT rollout — DB badge first, chain later. */
export type NftStage = 'db_badge' | 'nft_badge' | 'cosmetic' | 'marketplace';

export interface Achievement {
  id: UUID;
  code: string; // 'first_trade'
  name: string;
  description: string;
  icon: string | null;
  xpReward: number;
}

export interface UserAchievement {
  achievement: Achievement;
  status: AchievementStatus;
  progress: number; // 0..1
  unlockedAt: ISODateTime | null;
}

export interface Nft {
  id: UUID;
  userId: UUID;
  sourceAchievementId: UUID | null;
  stage: NftStage;
  chain: ChainKind | null;
  tokenId: string | null;
  metadataUri: string | null;
  mintedAt: ISODateTime | null;
}
