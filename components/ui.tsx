import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { rs } from "@/lib/pricing";
import type { PriceInfo, Product } from "@/lib/types";
import { productPrice } from "@/lib/pricing";

/* ─────────────── Product artwork ───────────────
 * Real photos when the admin has uploaded them; otherwise a resin-like
 * placeholder in the product's own colours (no fake "photo" labels in production).
 */

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ResinArt({ seed, tone, className = "" }: { seed: string; tone: [string, string]; className?: string }) {
  const h = hash(seed);
  const x1 = 20 + (h % 50);
  const y1 = 18 + ((h >> 3) % 40);
  const x2 = 35 + ((h >> 5) % 45);
  const y2 = 55 + ((h >> 7) % 30);
  const flecks = Array.from({ length: 7 }, (_, i) => ({
    x: 12 + ((h >> (i + 2)) % 76),
    y: 10 + ((h >> (i + 4)) % 80),
    r: 0.6 + ((h >> i) % 3) * 0.35,
  }));
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(60% 45% at ${x1}% ${y1}%, ${tone[1]}cc 0%, transparent 70%),
          radial-gradient(55% 40% at ${x2}% ${y2}%, ${tone[1]}88 0%, transparent 72%),
          radial-gradient(90% 70% at 50% 40%, #ffffff99 0%, transparent 60%),
          ${tone[0]}`,
      }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 125" preserveAspectRatio="none">
        <path
          d={`M-5 ${60 + (h % 20)} C 25 ${40 + (h % 25)}, 55 ${90 - (h % 30)}, 105 ${55 + (h % 15)}`}
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d={`M-5 ${75 + (h % 15)} C 30 ${60 + (h % 20)}, 60 ${100 - (h % 20)}, 105 ${70 + (h % 10)}`}
          stroke="#C9A45C"
          strokeOpacity="0.45"
          strokeWidth="0.45"
          fill="none"
        />
        {flecks.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y * 1.25} r={f.r} fill="#C9A45C" fillOpacity="0.7" />
        ))}
      </svg>
    </div>
  );
}

export function ProductMedia({
  product,
  sizes,
  priority,
  morph,
  className = "",
  rounded = "rounded-[14px] lg:rounded-2xl",
}: {
  product: Pick<Product, "slug" | "name" | "images" | "tone">;
  sizes: string;
  priority?: boolean;
  morph?: boolean;
  className?: string;
  rounded?: string;
}) {
  const [first, second] = product.images;
  const media = (
    <div className={`relative aspect-[4/5] overflow-hidden ${rounded} ${className}`}>
      {first ? (
        <>
          <Image
            src={first}
            alt={product.name}
            fill
            sizes={sizes}
            priority={priority}
            className="zoom-img object-cover"
          />
          {second ? (
            <Image
              src={second}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : null}
        </>
      ) : (
        <div role="img" aria-label={product.name} className="zoom-img absolute inset-0">
          <ResinArt seed={product.slug} tone={product.tone} />
        </div>
      )}
    </div>
  );
  return morph ? (
    <ViewTransition name={`product-${product.slug}`} share="morph" default="none">
      {media}
    </ViewTransition>
  ) : (
    media
  );
}

/* ─────────────── Price ─────────────── */

export function Price({ info, size = "md" }: { info: PriceInfo; size?: "sm" | "md" | "lg" }) {
  const now = size === "lg" ? "text-2xl" : size === "sm" ? "text-[15px] lg:text-lg" : "text-base lg:text-lg";
  if (!info.onSale) return <span className={`${now} font-bold`}>{rs(info.price)}</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="sr-only">Was</span>
      <s className="text-sm text-muted">{rs(info.was!)}</s>
      <span className="sr-only">now</span>
      <span className={`${now} font-bold`}>{rs(info.price)}</span>
      <span className={`pill-off ${size === "lg" ? "px-2.5 py-0.5 text-xs" : ""}`}>-{info.off}%</span>
    </span>
  );
}

/* ─────────────── Product card ─────────────── */

export function ProductCard({
  product,
  badge,
  sizes = "(min-width: 1280px) 290px, (min-width: 768px) 30vw, 45vw",
  morph,
  priority,
}: {
  product: Product;
  badge?: "best" | "custom";
  sizes?: string;
  morph?: boolean;
  priority?: boolean;
}) {
  const label = badge === "best" ? "Best seller" : badge === "custom" && product.customisable ? "Customisable" : null;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex min-w-0 flex-col gap-2.5 text-brown no-underline lg:gap-3.5"
    >
      <div className="relative">
        <ProductMedia product={product} sizes={sizes} morph={morph} priority={priority} />
        {label ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase lg:left-3.5 lg:top-3.5 lg:text-[11px]">
            {label}
          </span>
        ) : null}
        <span className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 rounded-xl bg-cream/95 py-2.5 text-center text-sm font-semibold opacity-0 shadow-[var(--shadow-float)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:block">
          View piece
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-[19px] leading-[1.15] font-semibold transition-colors group-hover:text-caramel lg:text-[23px]">
          {product.name}
        </h3>
        <Price info={productPrice(product)} />
      </div>
    </Link>
  );
}

/* ─────────────── Headings + layout bits ─────────────── */

export function Eyebrow({ children, line = false, className = "" }: { children: ReactNode; line?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 lg:gap-3 ${className}`}>
      {line ? <span aria-hidden="true" className="h-px w-6 bg-gold lg:w-8" /> : null}
      <span className="eyebrow">{children}</span>
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  center,
  action,
  as: As = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  center?: boolean;
  action?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={`flex gap-4 ${center ? "flex-col items-center text-center" : "items-end justify-between"} ${className}`}
    >
      <div className={`flex flex-col gap-1 lg:gap-1.5 ${center ? "items-center" : ""}`}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        {center && eyebrow ? <span aria-hidden="true" className="my-1 h-px w-8 bg-gold lg:w-10" /> : null}
        <As className="font-display text-[32px] leading-[1.1] font-medium lg:text-5xl lg:leading-[1.05]">{title}</As>
      </div>
      {action}
    </div>
  );
}

export function ArchFrame({
  children,
  className = "",
  bg = "radial-gradient(circle at 50% 32%, #FFFFFF 0%, #F6F2ED 45%, #ECE5DE 100%)",
  inset = 10,
  sheen = false,
  line = "always",
}: {
  children?: ReactNode;
  className?: string;
  bg?: string;
  inset?: number;
  sheen?: boolean;
  /** Gold inner line: always, only from 1024px up, or never */
  line?: "always" | "lg" | "none";
}) {
  return (
    <div className={`arch-wrap ${className}`}>
      <div
        className={`arch h-full w-full ${sheen ? "sheen" : ""}`}
        style={{ background: bg, ["--arch-i" as string]: `${inset}px` }}
      >
        {children}
        {line !== "none" ? (
          <span className={`arch-line ${line === "lg" ? "hidden lg:block" : ""}`} aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] lg:text-sm">
      <ol className="flex flex-wrap gap-1.5 lg:gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5 lg:gap-2">
            {it.href ? (
              <Link href={it.href} className="no-underline hover:text-caramel">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page">{it.label}</span>
            )}
            {i < items.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is built from trusted catalogue data; "<" is escaped to keep the script tag closed.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
