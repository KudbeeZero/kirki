# nft-service (Phase 5)

Progressive tokenization of achievements: `db_badge` → `nft_badge` →
`cosmetic` → `marketplace`. The service depends only on a narrow
`ChainMinter` interface; the default binding is an **off-chain DB minter**, so
on-chain support is added by plugging a `@simcoin/chain-<name>` adapter into the
`CHAIN_MINTER` token — never by changing the service.

## Endpoints (Phase 5)

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/nfts` | Caller's badges / NFTs across all stages. |
| `POST` | `/nfts/:achievement/mint` | Mint a badge for an unlocked achievement. **Guarded.** |

The caller's user id arrives as `x-user-id` from the API gateway; minting is
additionally protected by `GatewayAuthGuard`.

## Swapping the minter

`AppModule` binds `CHAIN_MINTER` → `DbBadgeMinter` (stage 1, off-chain). To
graduate badges on-chain, implement `ChainMinter` in a chain adapter package and
change that one `useClass`. The contract mirrors `ChainMinter`/`ChainAdapter`
in `@simcoin/shared`.

## Status

Phase 5. The minter dispatch and read path are real; mint **persistence** throws
(`TODO(phase-5)`) until the Phase-5 `nfts` schema lands.

## Run locally

```bash
pnpm --filter @simcoin/nft-service dev    # watch mode on :4007
pnpm --filter @simcoin/nft-service test   # unit tests
```
