# Mantis frontend

Devnet faucet and MAN/SOL pool UI, served under
[projects.vedantshukla.in/mantis](https://projects.vedantshukla.in/mantis).

## Development

```bash
bun install
bun dev
```

Open [http://localhost:3000/mantis](http://localhost:3000/mantis). The
`/mantis` prefix comes from `basePath` in `next.config.ts` and is applied
automatically to `next/link` and `useRouter`.

No environment variables are required for the devnet faucet. If `RPC_URL` is
empty, the JSON-RPC proxy falls back to the public Solana devnet endpoint. Set
`RPC_URL` to a dedicated devnet endpoint to avoid public rate limits.

## Claim flow

The faucet claims against the devnet program
`222rpnLzA6VLmZxniTePoqasCYz72aYjBZLhVtYiwjkR`.

- `lib/program.ts` builds the Anchor client, exports the program ID and IDL,
  and derives the config, mint, and per-wallet claim PDAs plus the user's MAN
  associated token account. Seeds mirror `constants.rs` in the program
  (`config`, `mint`, `claim`).
- `lib/constants.ts` mirrors the on-chain limits: 6 decimals, 1 MAN base
  claim, a maximum multiplier of 3 (3 MAN per window), and an 86,400-second
  window.
- `lib/claim.ts` builds `claims(multiplier)` with the current blockhash, sends
  it through the wallet adapter, and confirms by polling `getSignatureStatuses`
  through the same-origin RPC proxy. Wallet rejections, program errors
  (`LimitReached`, `InvalidMultiplier`, `Overflow`), confirmation timeouts, and
  insufficient SOL are mapped to readable messages.
- `hooks/useUserClaim.ts` reads the `UserClaim` PDA, treats a missing account
  as zero claimed, and refreshes after a confirmed claim.
- `components/faucetPanel.tsx` contains the form and shows the confirmed
  signature with a devnet explorer link. `components/claimStatus.tsx` shows
  claimed, remaining, and the window countdown.

The first claim creates the wallet's claim account and MAN token account, so
the wallet needs a small amount of devnet SOL for rent. Airdrop devnet SOL to
the wallet before claiming.

### Updating the IDL

After changing the program, rebuild it and copy the generated files into this
repository. The frontend never imports from the program repository directly.

```bash
# in the program repository
anchor build

# from this repository
cp ../man-faucet/target/idl/man_faucet.json lib/idl/man_faucet.json
cp ../man-faucet/target/types/man_faucet.ts lib/idl/man_faucet.ts
```

Keep `lib/constants.ts` in sync with the program's `constants.rs`.

## Pool UI

The MAN/SOL trading interface is served at `/pool`.

### Setup

Set `NEXT_PUBLIC_RPC_URL` (or the server-only `RPC_URL`) in `.env`. Browser
traffic goes through the same-origin proxy in `app/api/rpc/route.ts`; leaving
both empty uses the public Solana devnet RPC.

- Cluster: Solana devnet
- Program: `DwMeAF9UFscahiqeYKr1CmKhEwdp9TBxihGbcK5YqJFm`
- MAN mint: `9JyKSkrvCcwivA2W12zgNDSAmgpDH6fdfaioCYYBJ3vs` (6 decimals)
- wSOL mint: `So11111111111111111111111111111111111111112` (9 decimals)

### Features

- Candlestick chart built from pool vault history, with 1m/5m/15m/1h buckets
  and a live last candle.
- Buy/sell swaps with fee-aware quotes, price impact, slippage, min received,
  and a SOL fee reserve.
- Native SOL wrap/unwrap, LP add/remove with pool-ratio fills, positions, and
  recent program history with Solscan links.

The IDL in `lib/idl/man_amm.json` and `lib/idl/man_amm.ts` must be re-copied
from the program repository after each program build:

```bash
cp ../man-amm/target/idl/man_amm.json lib/idl/man_amm.json
cp ../man-amm/target/types/man_amm.ts lib/idl/man_amm.ts
```

## Production

```bash
bun run build
bun run start
```

## Deployment notes

- Keep the `/mantis` prefix when proxying requests to the app.
- Security headers and the Content Security Policy live in `next.config.ts`.
- Metadata lives in `app/layout.tsx`; `app/sitemap.ts` and `app/robots.ts`
  cover crawlers. Canonical URLs are explicit because the app is mounted on a
  sub-path.
- All browser RPC traffic goes through `app/api/rpc/route.ts`. The proxy only
  forwards the methods the UI needs, including `getLatestBlockhash`,
  `sendTransaction`, `getSignatureStatuses`, `getBlockHeight`, and
  `getAccountInfo`. Add a method there before using a new RPC call in the
  client.
