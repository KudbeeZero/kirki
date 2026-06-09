import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import type { Comment, Friendship, Post, UUID } from '@simcoin/types';

/**
 * Social graph & feed service (Phase 2).
 *
 * Owns the friend graph, follows, the activity/trade feed, and user-generated
 * content (posts, comments, likes) plus guilds. Reads of public profiles and
 * the feed are cache-friendly; writes fan out feed entries to followers.
 *
 * The method signatures below are the locked Phase-2 contract. Bodies throw
 * {@link NotImplementedException} until the Phase-2 schema migration lands —
 * they are intentional seams, not forgotten stubs.
 */
@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  // ── Friends & follows ───────────────────────────────────────────────────────

  /** List the caller's friendships (accepted, pending, blocked). */
  listFriends(_userId: UUID): Promise<Friendship[]> {
    throw new NotImplementedException('listFriends — TODO(phase-2)');
  }

  /** Send a friend request from the caller to `targetId`. */
  requestFriend(_userId: UUID, _targetId: UUID): Promise<Friendship> {
    throw new NotImplementedException('requestFriend — TODO(phase-2)');
  }

  /** Follow another user (asymmetric, unlike friendship). */
  follow(_userId: UUID, _targetId: UUID): Promise<{ following: boolean }> {
    throw new NotImplementedException('follow — TODO(phase-2)');
  }

  // ── Feed & posts ────────────────────────────────────────────────────────────

  /**
   * The caller's trade/activity feed: posts from people they follow plus
   * notable trades, newest first.
   */
  getFeed(_userId: UUID, _limit = 50, _cursor?: string): Promise<Post[]> {
    throw new NotImplementedException('getFeed — TODO(phase-2)');
  }

  /** Create a post, optionally referencing a trade. */
  createPost(_userId: UUID, _body: string, _tradeRef?: UUID): Promise<Post> {
    throw new NotImplementedException('createPost — TODO(phase-2)');
  }

  /** Toggle a like on a post; returns the new like count + state. */
  toggleLike(_userId: UUID, _postId: UUID): Promise<{ likeCount: number; likedByMe: boolean }> {
    throw new NotImplementedException('toggleLike — TODO(phase-2)');
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  /** List comments on a post, oldest first. */
  listComments(_postId: UUID): Promise<Comment[]> {
    throw new NotImplementedException('listComments — TODO(phase-2)');
  }

  /** Add a comment to a post. */
  addComment(_userId: UUID, _postId: UUID, _body: string): Promise<Comment> {
    throw new NotImplementedException('addComment — TODO(phase-2)');
  }

  // ── Guilds ──────────────────────────────────────────────────────────────────

  /** List guilds the caller belongs to. */
  listMyGuilds(_userId: UUID): Promise<{ id: UUID; name: string }[]> {
    throw new NotImplementedException('listMyGuilds — TODO(phase-2)');
  }
}
