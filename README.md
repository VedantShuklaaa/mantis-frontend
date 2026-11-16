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
