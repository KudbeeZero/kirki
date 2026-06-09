# @simcoin/chain-solana

Solana chain adapter for the NFT service. **Solana is the high-throughput mint
target**: very high TPS and extremely cheap *compressed* NFTs (cNFTs via the
Metaplex Bubblegum program) make it the choice for large batched drops and
seasonal campaigns.

## Role in the system

Implements the shared [`ChainAdapter`](../../packages/shared/src/chain.ts)
contract (`mintAchievement`, `verifyWalletSignature`, `getExplorerUrl`). The NFT
service dispatches by chain over this contract, so Solana plugs in with no
service-side refactor.

```ts
import { SolanaAdapter } from '@simcoin/chain-solana';

const solana = new SolanaAdapter({
  rpcUrl: process.env.SOLANA_RPC_URL!,
  cluster: 'mainnet-beta',
});
```

## Status

On-chain operations (`mintAchievement`, the Ed25519 step of
`verifyWalletSignature`) are deferred to **phase 5** and throw
`NotImplementedException` (`// TODO(phase 5)`). Address validation and the
explorer-URL builder are real today. Verification will base58-decode the address
to its Ed25519 public key and use `nacl.sign.detached.verify`.
