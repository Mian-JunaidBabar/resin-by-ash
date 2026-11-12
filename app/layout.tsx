import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import "./globals.css";

/* Fonts are the exact latin subsets shipped in the design export, self-hosted (no Google request). */
const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/cormorant-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const dmSans = localFont({
  src: [{ path: "./fonts/dm-sans.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-dm-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · Handmade resin keepsakes in Pakistan`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "resin art Pakistan",
    "nikkah tray",
    "nikah pen",
    "resin jewellery",
    "flower preservation",
    "bridal bouquet preservation",
    "resin keychain",
    "resin wall clock",
    "custom resin gifts",
    "Lahore",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: `${SITE.name} · Keepsakes, poured by hand`,
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} · Keepsakes, poured by hand`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  category: "shopping",
};

export const viewport: Viewport = {
  themeColor: "#FBF9F6",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PK" className={`${cormorant.variable} ${dmSans.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
