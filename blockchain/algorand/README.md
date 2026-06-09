# @simcoin/chain-algorand

Algorand chain adapter for the NFT service. **Algorand is the primary mint
target**: sub-cent fees (~0.001 ALGO) and instant finality make it the default
for high-volume achievement badges, which are minted as Algorand Standard Assets
(ASAs) with ARC-3/ARC-69 metadata.

## Role in the system

Implements the shared [`ChainAdapter`](../../packages/shared/src/chain.ts)
contract (`mintAchievement`, `verifyWalletSignature`, `getExplorerUrl`). The NFT
service depends only on that contract, so this package plugs in without any
service-side changes — the hard modularity requirement.

```ts
import { AlgorandAdapter } from '@simcoin/chain-algorand';

const algorand = new AlgorandAdapter({
  algodUrl: process.env.ALGOD_URL!,
  network: 'mainnet',
});
// nft-service: adapters[ 'algorand' ] = algorand
```

## Status

On-chain operations (`mintAchievement`, the Ed25519 step of
`verifyWalletSignature`) are deferred to **phase 5** and throw
`NotImplementedException`, marked `// TODO(phase 5)`. Address structural
validation and the explorer-URL builder are real today. Signature verification
will use `algosdk.decodeAddress` + `nacl.sign.detached.verify`.
