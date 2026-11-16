import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/paths";

const isDev = process.env.NODE_ENV === "development";

/*
 * The browser only talks to our same-origin JSON-RPC proxy
 * (`app/api/rpc/route.ts`); the upstream RPC URL stays server-side, so no
 * external RPC origins need to be allowed here.
 */
const connectSources = ["'self'", ...(isDev ? ["ws:"] : [])];

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
  basePath: BASE_PATH,
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
