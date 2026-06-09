import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post as HttpPost,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { Comment, Friendship, Post, UUID } from '@simcoin/types';
import { SocialService } from './social.service.js';

/**
 * HTTP surface for the social graph & feed (Phase 2). The caller's id is
 * forwarded by the gateway as `x-user-id`.
 */
@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  // ── Friends & follows ───────────────────────────────────────────────────────

  @Get('friends')
  friends(@Headers('x-user-id') userId?: string): Promise<Friendship[]> {
    return this.social.listFriends(this.requireUser(userId));
  }

  @HttpPost('friends/:targetId')
  addFriend(
    @Headers('x-user-id') userId: string | undefined,
    @Param('targetId') targetId: string,
  ): Promise<Friendship> {
    return this.social.requestFriend(this.requireUser(userId), targetId);
  }

  @HttpPost('follow/:targetId')
  follow(
    @Headers('x-user-id') userId: string | undefined,
    @Param('targetId') targetId: string,
  ): Promise<{ following: boolean }> {
    return this.social.follow(this.requireUser(userId), targetId);
  }

  // ── Feed & posts ────────────────────────────────────────────────────────────

  @Get('feed')
  feed(
    @Headers('x-user-id') userId: string | undefined,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<Post[]> {
    return this.social.getFeed(this.requireUser(userId), limit ? Number(limit) : 50, cursor);
  }

  @HttpPost('posts')
  createPost(
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: { body: string; tradeRef?: string },
  ): Promise<Post> {
    return this.social.createPost(this.requireUser(userId), dto.body, dto.tradeRef);
  }

  @HttpPost('posts/:postId/like')
  like(
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
  ): Promise<{ likeCount: number; likedByMe: boolean }> {
    return this.social.toggleLike(this.requireUser(userId), postId);
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  @Get('posts/:postId/comments')
  comments(@Param('postId') postId: string): Promise<Comment[]> {
    return this.social.listComments(postId);
  }

  @HttpPost('posts/:postId/comments')
  addComment(
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
    @Body() dto: { body: string },
  ): Promise<Comment> {
    return this.social.addComment(this.requireUser(userId), postId, dto.body);
  }

  // ── Guilds ──────────────────────────────────────────────────────────────────

  @Get('guilds')
  guilds(@Headers('x-user-id') userId?: string): Promise<{ id: UUID; name: string }[]> {
    return this.social.listMyGuilds(this.requireUser(userId));
  }

  private requireUser(userId?: string): UUID {
    if (!userId) throw new UnauthorizedException('Missing authenticated user.');
    return userId;
  }
}
