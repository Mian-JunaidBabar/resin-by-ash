/**
 * Site-wide settings. In phase 2 most of these move to the admin "Settings" screen
 * (stored in the database) and are read through lib/queries.ts.
 */
export const SITE = {
  name: "Resin by Ash",
  shortName: "Resin by Ash",
  tagline: "Keepsakes, poured by hand.",
  description:
    "Handmade resin keepsakes from a small studio in Pakistan: nikkah trays and pens, resin jewellery, wedding flower preservation, keychains, watches and custom pieces. Cash on Delivery nationwide.",
  // Domain comes from NEXT_PUBLIC_SITE_URL; the fallback is the production domain.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://resinbyash.pk",
  locale: "en_PK",
  currency: "PKR",
  country: "PK",
  // International format without "+" or spaces, as wa.me expects. Set the real
  // studio number in NEXT_PUBLIC_WHATSAPP_NUMBER before launch.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567",
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "+92 300 1234567",
  instagram: "https://www.instagram.com/resin.by.ash",
  instagramHandle: "@resin.by.ash",
  tiktok: "https://www.tiktok.com/@resin._by._ash",
  tiktokHandle: "@resin._by._ash",
  googleBusinessUrl: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL ?? "",
  announcement: "Cash on Delivery all over Pakistan · Custom orders open",
  studioHours: [
    { days: "Monday – Saturday", hours: "10am – 7pm" },
    { days: "Sunday", hours: "Closed" },
  ],
  orderPrefix: "RBA-",
  defaultLeadTime: "5–7 working days",
} as const;

/** Header navigation (desktop bar + mobile menu): Home, Shop, About, Contact only. */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const TRUST_POINTS = [
  "Handmade by Ash",
  "Cash on Delivery",
  "Nationwide delivery",
  "Free personalisation",
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE.url).toString();
}
