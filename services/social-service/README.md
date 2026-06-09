# social-service (Phase 2)

The social graph and activity feed: friends, public profiles, follows, the
trade feed, posts, comments, likes, and guilds.

## Endpoints (Phase 2)

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/friends` | Caller's friendships. |
| `POST` | `/friends/:targetId` | Send a friend request. |
| `POST` | `/follow/:targetId` | Follow a user. |
| `GET`  | `/feed` | Trade/activity feed. `?limit&cursor`. |
| `POST` | `/posts` | Create a post (optionally referencing a trade). |
| `POST` | `/posts/:postId/like` | Toggle a like. |
| `GET`  | `/posts/:postId/comments` | List comments. |
| `POST` | `/posts/:postId/comments` | Add a comment. |
| `GET`  | `/guilds` | Caller's guilds. |

The caller's user id arrives as `x-user-id` from the API gateway.

## Status

Phase 2. The service/controller contract is in place; service bodies throw
`NotImplementedException` (`TODO(phase-2)`) until the social schema migration
lands — these are deliberate seams.

## Run locally

```bash
pnpm --filter @simcoin/social-service dev    # watch mode on :4006
pnpm --filter @simcoin/social-service test   # unit tests
```
