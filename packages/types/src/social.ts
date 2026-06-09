import type { UUID, ISODateTime } from './index.js';

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
  userId: UUID;
  friendId: UUID;
  status: FriendStatus;
  createdAt: ISODateTime;
}

export interface Post {
  id: UUID;
  userId: UUID;
  handle: string;
  body: string;
  tradeRef: UUID | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: ISODateTime;
}

export interface Comment {
  id: UUID;
  postId: UUID;
  userId: UUID;
  handle: string;
  body: string;
  createdAt: ISODateTime;
}
