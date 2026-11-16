import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/* Allow the configured devnet RPC (and its websocket twin) through connect-src. */
function rpcConnectSources() {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL;
  if (!endpoint) return [];

  try {
    const url = new URL(endpoint);
    const sources = [url.origin];
    const socketProtocol =
      url.protocol === "https:" ? "wss:" : url.protocol === "http:" ? "ws:" : null;
    if (socketProtocol) sources.push(`${socketProtocol}//${url.host}`);
    return sources;
  } catch {
    return [];
  }
}

const connectSources = [
  "'self'",
  ...(isDev ? ["ws:"] : []),
  "https://api.devnet.solana.com",
  "wss://api.devnet.solana.com",
  ...rpcConnectSources(),
];

/*
 * Static-friendly CSP (no per-request nonce, so pages stay prerenderable).
 * Next.js emits inline bootstrap scripts, and React/motion set inline style
 * attributes, hence 'unsafe-inline' for scripts and styles.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src ${connectSources.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  // HSTS already enforces HTTPS; omitting upgrade-insecure-requests keeps
  // plain-HTTP local `next start` checks working.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  basePath: "/mantis",
  async headers() {
    return [
      {
        // basePath is applied automatically, so this covers /mantis/*
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
