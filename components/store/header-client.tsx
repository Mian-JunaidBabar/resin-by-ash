"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BagIcon, CloseIcon, InstagramIcon, MenuIcon, SearchIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { ResinArt } from "@/components/ui";
import { track } from "@/lib/analytics";
import { useCartCount } from "@/lib/cart";
import { rs } from "@/lib/pricing";
import { NAV_LINKS, SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

export type SearchItem = {
  slug: string;
  name: string;
  price: number;
  category: string;
  keywords: string;
  tone: [string, string];
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Shop stays active on category and product pages
  if (href === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/product/");
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden justify-center gap-8 text-[15px] font-medium lg:flex xl:gap-[34px]">
      {NAV_LINKS.map((l) => {
        const on = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            className={`relative py-3 no-underline transition-colors hover:text-caramel after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300 ${
              on ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CartLink() {
  const count = useCartCount();
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sand"
    >
      <BagIcon size={21} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className={`absolute top-[5px] right-[3px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-caramel px-1 text-[10px] font-bold text-white ${bump ? "bump" : ""}`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const titleId = useId();
  const close = () => dialog.current?.close();
  // Close after navigating
  useEffect(() => dialog.current?.close(), [pathname]);
  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => dialog.current?.showModal()}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sand lg:hidden"
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        // closedby is a progressive enhancement for back-gesture + light dismiss
        {...{ closedby: "any" }}
        className="sheet sheet-left"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sand-2 px-5 py-3">
            <h2 id={titleId} className="font-display text-[26px] font-semibold">
              Menu
            </h2>
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col px-5 py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className="border-b border-sand-2 py-3.5 font-display text-2xl font-medium no-underline aria-[current=page]:text-caramel"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex gap-2.5 px-5 pb-8">
            <a href={waLink()} className="btn btn-primary flex-1" target="_blank" rel="noopener">
              <WhatsAppIcon size={20} /> WhatsApp
            </a>
            <a href={SITE.instagram} className="btn btn-outline !px-4" target="_blank" rel="noopener" aria-label="Instagram">
              <InstagramIcon size={20} />
            </a>
            <a href={SITE.tiktok} className="btn btn-outline !px-4" target="_blank" rel="noopener" aria-label="TikTok">
              <TikTokIcon size={20} />
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}

const norm = (s: string) => s.toLowerCase().replace(/nikah/g, "nikkah").replace(/jewelry/g, "jewellery").replace(/[’']/g, "");

export function SearchButton({ items }: { items: SearchItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const titleId = useId();
  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.filter((i) => words.every((w) => norm(i.keywords).includes(w))).slice(0, 6);
  }, [q, items]);
  useEffect(() => dialog.current?.close(), [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => dialog.current?.showModal()}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sand"
      >
        <SearchIcon size={21} />
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        {...{ closedby: "any" }}
        className="sheet sheet-top max-h-[85dvh] overflow-y-auto"
      >
        <form
          role="search"
          className="wrap flex flex-col gap-4 py-5 lg:py-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) track("search", { search_term: q.trim() });
            close();
            router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="eyebrow">
              Search the studio
            </h2>
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <label className="relative block">
            <span className="sr-only">Search pieces</span>
            <SearchIcon size={20} className="absolute top-1/2 left-4 -translate-y-1/2 text-cocoa" />
            <input
              type="search"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search trays, bangles, names, colours…"
              className="field !h-14 !pl-12 font-display !text-2xl"
              enterKeyHint="search"
            />
          </label>
          {q.trim().length >= 2 ? (
            results.length ? (
              <ul className="flex flex-col divide-y divide-sand-2" aria-live="polite">
                {results.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/product/${r.slug}`}
                      onClick={close}
                      className="group flex items-center gap-3.5 py-3 no-underline"
                    >
                      <span className="relative h-[60px] w-12 shrink-0 overflow-hidden rounded-lg">
                        <ResinArt seed={r.slug} tone={r.tone} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-xl font-semibold group-hover:text-caramel">{r.name}</span>
                        <span className="text-[13px] text-cocoa">{r.category}</span>
                      </span>
                      <span className="text-[15px] font-bold">{rs(r.price)}</span>
                    </Link>
                  </li>
                ))}
                <li className="pt-3">
                  <button type="submit" className="link-underline text-sm font-semibold">
                    See all results for “{q.trim()}”
                  </button>
                </li>
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3 py-4" aria-live="polite">
                <p className="font-display text-2xl">
                  Nothing yet, but <em>Ash can make it.</em>
                </p>
                <Link href="/custom" onClick={close} className="btn btn-primary">
                  Describe your idea
                </Link>
              </div>
            )
          ) : (
            <div className="flex flex-wrap gap-2">
              {["Nikkah tray", "Bangle", "Name keychain", "Bouquet", "Clock"].map((s) => (
                <button key={s} type="button" className="chip !h-9 text-[13px]" onClick={() => setQ(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
