import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { CartLink, DesktopNav, MobileMenu, SearchButton, type SearchItem } from "@/components/store/header-client";
import { SITE, TRUST_POINTS } from "@/lib/site";
import type { StoreSettings } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function Header({ searchItems, settings }: { searchItems: SearchItem[]; settings: StoreSettings }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-brown px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {settings.announcementOn && settings.announcement ? (
        <div className="flex h-9 items-center justify-center bg-sand px-4 text-center text-xs tracking-[0.03em] lg:h-10 lg:text-[13px] lg:tracking-[0.04em]">
          {settings.announcement}
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-sand-2 bg-cream/90 backdrop-blur-md supports-[backdrop-filter]:bg-cream/80">
        <div className="wrap grid h-[76px] grid-cols-[88px_1fr_88px] items-center !px-2 md:!px-10 lg:h-[88px] lg:grid-cols-[200px_1fr_200px] xl:!px-[120px]">
          {/* Left: mobile menu + search / desktop logo */}
          <div className="flex items-center lg:hidden">
            <Suspense fallback={<span className="h-11 w-11" />}>
              <MobileMenu />
            </Suspense>
            <Suspense fallback={<span className="h-11 w-11" />}>
              <SearchButton items={searchItems} />
            </Suspense>
          </div>
          <Link href="/" aria-label={`${SITE.name} home`} className="hidden w-[72px] lg:flex">
            <Image src="/brand/logo-256.png" alt={SITE.name} width={72} height={72} priority className="rounded-full" />
          </Link>

          {/* Centre: mobile logo / desktop nav */}
          <Link href="/" aria-label={`${SITE.name} home`} className="flex justify-center lg:hidden">
            <Image src="/brand/logo-256.png" alt={SITE.name} width={58} height={58} priority className="rounded-full" />
          </Link>
          <Suspense fallback={<span className="hidden h-11 lg:block" />}>
            <DesktopNav />
          </Suspense>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5 lg:gap-1">
            <span className="hidden lg:block">
              <Suspense fallback={<span className="block h-11 w-11" />}>
                <SearchButton items={searchItems} />
              </Suspense>
            </span>
            <CartLink />
            <a
              href={waLink(undefined, settings.whatsappNumber)}
              target="_blank"
              rel="noopener"
              aria-label="Chat on WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sand"
            >
              <WhatsAppIcon size={21} />
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

const SHOP_LINKS = [
  { label: "All pieces", href: "/shop" },
  { label: "Nikkah", href: "/shop/nikkah" },
  { label: "Jewellery", href: "/shop/jewellery" },
  { label: "Flower preservation", href: "/shop/flower-preservation" },
  { label: "Keychains", href: "/shop/keychains" },
  { label: "Watches & clocks", href: "/shop/watches-clocks" },
];
const HELP_LINKS = [
  { label: "Custom order", href: "/custom" },
  { label: "FAQ", href: "/faq" },
  { label: "Delivery & COD", href: "/faq#delivery" },
  { label: "About Ash", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function FooterCol({ title, links }: { title: string; links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2.5 text-sm lg:gap-3 lg:text-[15px]">
      <strong className="text-xs font-semibold tracking-[0.14em] text-gold uppercase lg:tracking-[0.16em]">{title}</strong>
      {links.map((l) =>
        l.external ? (
          <a key={l.label} href={l.href} target="_blank" rel="noopener" className="w-fit text-cream no-underline hover:text-gold">
            {l.label}
          </a>
        ) : (
          <Link key={l.label} href={l.href} className="w-fit text-cream no-underline hover:text-gold">
            {l.label}
          </Link>
        ),
      )}
    </nav>
  );
}

export function Footer({ shopLinks = SHOP_LINKS, settings }: { shopLinks?: { label: string; href: string }[]; settings: StoreSettings }) {
  return (
    <footer className="bg-brown text-cream">
      <div className="wrap flex flex-col gap-7 pt-10 pb-7 lg:gap-10 lg:pt-16 lg:pb-9">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <Image
                src="/brand/logo-256.png"
                alt={SITE.name}
                width={108}
                height={108}
                className="h-[84px] w-[84px] rounded-full lg:h-[108px] lg:w-[108px]"
              />
              <p className="max-w-[320px] text-sm leading-relaxed lg:text-[15px] lg:leading-[1.65]">
                Handmade resin keepsakes from a small studio in Pakistan.
                <span className="hidden lg:inline"> Cash on Delivery nationwide.</span>
              </p>
            </div>
            <span aria-hidden="true" className="h-px w-10 bg-gold lg:hidden" />
          </div>
          <FooterCol title="Shop" links={[{ label: "All pieces", href: "/shop" }, ...shopLinks]} />
          <FooterCol title="Help" links={HELP_LINKS} />
          <div className="col-span-2 lg:col-span-1">
            <div className="flex gap-2.5 lg:hidden">
              {[
                { label: "WhatsApp", href: waLink(undefined, settings.whatsappNumber) },
                { label: "Instagram", href: settings.instagram || SITE.instagram },
                { label: "TikTok", href: settings.tiktok || SITE.tiktok },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  className="flex h-[46px] flex-1 items-center justify-center rounded-xl border border-gold text-sm font-medium text-cream no-underline transition-colors hover:bg-cream/10"
                >
                  {s.label}
                </a>
              ))}
            </div>
            <div className="hidden lg:block">
              <FooterCol
                title="Say hello"
                links={[
                  { label: "WhatsApp", href: waLink(undefined, settings.whatsappNumber), external: true },
                  { label: "Instagram", href: settings.instagram || SITE.instagram, external: true },
                  { label: "TikTok", href: settings.tiktok || SITE.tiktok, external: true },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-4 border-t border-gold/40 pt-4 text-xs lg:pt-5 lg:text-[13px]">
          <span>© {SITE_YEAR} {SITE.name}</span>
          <span className="lg:hidden">Cash on Delivery nationwide</span>
          <span className="hidden lg:inline">Handmade in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}

// Fixed at build time so the footer stays in the static shell (Cache Components forbids Date in render).
const SITE_YEAR = 2026;

export function WhatsAppFab({ phone }: { phone: string }) {
  return (
    <a
      href={waLink("Assalam o Alaikum Ash! I have a question about an order.", phone)}
      target="_blank"
      rel="noopener"
      aria-label="Order on WhatsApp"
      className="enter ping fixed right-4 bottom-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-caramel text-white no-underline shadow-[var(--shadow-float)] transition-colors hover:bg-caramel-dark hover:text-white lg:right-8 lg:bottom-8 lg:w-auto lg:gap-2.5 lg:pr-[22px] lg:pl-[18px]"
      style={{ ["--d" as string]: "900ms" }}
    >
      <WhatsAppIcon size={26} strokeWidth={1.7} />
      <span className="hidden text-[15px] font-semibold lg:inline">Order on WhatsApp</span>
    </a>
  );
}

export function TrustRow() {
  return (
    <section
      aria-label="Why shop with Ash"
      className="wrap grid grid-cols-2 gap-x-3 gap-y-5 border-t border-sand-2 py-7 pb-10 lg:grid-cols-4 lg:gap-6 lg:py-9 lg:pb-14"
    >
      {TRUST_POINTS.map((t) => (
        <div key={t} className="flex items-center gap-2.5 lg:justify-center lg:gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold lg:h-11 lg:w-11">
            <CheckIcon size={18} />
          </span>
          <span className="text-[13px] leading-tight font-semibold lg:text-[15px]">{t}</span>
        </div>
      ))}
    </section>
  );
}
