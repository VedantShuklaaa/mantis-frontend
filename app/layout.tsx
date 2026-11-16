import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/siteFooter";
import { BASE_PATH, SITE_NAME, SITE_URL, socialMetadata } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "Claim up to 3 MAN every 24 hours on Solana devnet. Mantis is a small toolkit for testing the MAN token and the MAN/SOL pool.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mantis — Solana devnet MAN faucet",
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Mantis",
    "MAN token",
    "Solana devnet",
    "Solana faucet",
    "MAN SOL pool",
    "SPL token",
    "devnet airdrop",
  ],
  authors: [{ name: SITE_NAME, url: `${SITE_URL}${BASE_PATH}` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...socialMetadata("Mantis — Solana devnet MAN faucet", DESCRIPTION),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f7f7f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-svh flex-col bg-background text-foreground">
        <Navbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
