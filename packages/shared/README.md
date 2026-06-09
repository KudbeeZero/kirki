# @simcoin/shared

Cross-cutting runtime utilities shared by every Simcoin service. Depends only on
[`@simcoin/types`](../types).

## Modules

| Module      | Export style        | What it provides                                                        |
| ----------- | ------------------- | ---------------------------------------------------------------------- |
| `logger`    | named               | Structured JSON `Logger` interface + `createLogger` console impl, `noopLogger`. |
| `redis`     | named               | Typed `Redis` facade over any `RedisClient`: get/set/JSON, pub/sub, leaderboard `zadd`/`zrevrange`. |
| `errors`    | named               | `AppError` base + `DomainError`/`ValidationError`/`NotFoundError`/… with stable codes and HTTP status. |
| `config`    | named               | `loadConfig(schema)` env loader with coercers (`int`, `bool`, `url`, `oneOf`) and aggregated validation. |
| `chain`     | named               | `ChainAdapter`/`ChainMinter` contract implemented by each `@simcoin/chain-*` package. |
| `decimal`   | namespace (`decimal`) | Fixed-point money math on the string `Decimal` type. **Money never uses JS float.** |

## Usage

```ts
import { createLogger, loadConfig, int, url, NotFoundError, decimal } from '@simcoin/shared';

const log = createLogger({ base: { service: 'api' } });

const cfg = loadConfig({
  port: { env: 'PORT', parse: int(), default: 3000 },
  redisUrl: { env: 'REDIS_URL', parse: url() },
});

const total = decimal.add('100.50', '0.25'); // "100.75" — exact, via bigint minor units
if (decimal.lt(total, '0')) throw new NotFoundError('Portfolio');
```

### Money

`decimal` scales every string value to integer `bigint` minor units (8 dp) and
does exact integer arithmetic, formatting back to a canonical string. This is
why balances and PnL cross the wire as `Decimal` (string), never `number`.

### Chain adapter contract

`chain.ts` defines `ChainAdapter` (`mintAchievement`, `verifyWalletSignature`,
`getExplorerUrl`). The NFT service holds a `Record<ChainKind, ChainAdapter>` and
dispatches by chain, so adding a chain means shipping a new adapter package —
not editing the service.
