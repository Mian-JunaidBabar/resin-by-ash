import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://wa.me",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${gaId ? " https://www.googletagmanager.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.public.blob.vercel-storage.com https://www.google-analytics.com",
  "font-src 'self' data:",
  "media-src 'self' blob: https://res.cloudinary.com https://*.public.blob.vercel-storage.com",
  `connect-src 'self'${gaId ? " https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com" : ""} https://vitals.vercel-insights.com`,
  "frame-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const cspHeader = process.env.CSP_REPORT_ONLY === "1" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

const securityHeaders = [
  { key: cspHeader, value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  partialPrefetching: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin/:path*", headers: noindex },
      { source: "/cart", headers: noindex },
      { source: "/thank-you", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
