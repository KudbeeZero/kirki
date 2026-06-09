# @simcoin/chain-icp

Internet Computer (ICP) chain adapter for the NFT service. **ICP is the
fully-on-chain assets target**: canisters can store the NFT image and metadata
bytes *on-chain* (not just an IPFS pointer), so ICP is used for premium,
self-contained collectibles. NFTs follow the ICRC-7 standard and are minted via
an asset canister.

## Role in the system

Implements the shared [`ChainAdapter`](../../packages/shared/src/chain.ts)
contract (`mintAchievement`, `verifyWalletSignature`, `getExplorerUrl`), so the
NFT service can mint to ICP through the same interface as Algorand and Solana —
no service-side refactor.

```ts
import { IcpAdapter } from '@simcoin/chain-icp';

const icp = new IcpAdapter({
  canisterId: process.env.ICP_NFT_CANISTER_ID!,
  host: 'https://icp-api.io',
});
```

## Status

On-chain operations are deferred to **phase 5** and throw
`NotImplementedException` (`// TODO(phase 5)`). Note that ICP authentication
differs from the L1 chains: users authenticate via an **Internet Identity
delegation** rather than a raw Ed25519 wallet signature, so
`verifyWalletSignature` validates a delegation chain for a textual principal
(structural principal validation is real today). Minting will use
`@dfinity/agent` to call the ICRC-7 canister.
