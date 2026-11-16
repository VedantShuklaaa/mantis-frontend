import type { Metadata } from "next";

/** Public origin that hosts the app. */
export const SITE_URL = "https://projects.vedantshukla.in";

/** The app is mounted under this sub-path (mirrors `basePath` in next.config.ts). */
export const BASE_PATH = "/mantis";

export const SITE_NAME = "Mantis";

/** Absolute, base-path-aware URL for a route below `/mantis`. */
export function absoluteUrl(path = "") {
  return `${SITE_URL}${BASE_PATH}${path}`;
}

/** Shared Open Graph + Twitter fields so sub-pages don't inherit stale social URLs. */
export function socialMetadata(
  title: string,
  description: string,
  path = "",
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      url: absoluteUrl(path),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
