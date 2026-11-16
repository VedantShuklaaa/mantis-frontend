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
