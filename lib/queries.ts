import { cacheLife, cacheTag } from "next/cache";
import { BEST_SELLER_ORDER, CATEGORIES, PRODUCTS } from "@/lib/data/catalog";
import { productPrice } from "@/lib/pricing";
import type { Category, CategorySlug, Product } from "@/lib/types";

/**
 * Read layer for the storefront.
 *
 * Every function is async and cached with a tag, so phase 2 only has to swap the
 * function bodies for database queries (Prisma) and call revalidateTag() from the
 * admin mutations. Page components never import lib/data directly.
 */

const live = (p: Product) => p.status === "live";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return [...CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return CATEGORIES.find((c) => c.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return PRODUCTS.filter(live);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${slug}`);
  return PRODUCTS.find((p) => p.slug === slug && p.status !== "draft");
}

/** Home "Latest arrivals": newest first. Phase 2: honour the admin "Show in Latest arrivals" toggle. */
export async function getLatest(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return PRODUCTS.filter(live)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Home "Best sellers": pinned products first (admin toggle), then by units sold.
 * Phase 2: soldCount = quantity in Confirmed-or-later orders over the last 90 days.
 */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "orders");
  const rank = (p: Product) => {
    const i = BEST_SELLER_ORDER.indexOf(p.slug);
    return p.pinnedBestSeller ? (i === -1 ? 99 : i) : 999;
  };
  return PRODUCTS.filter(live)
    .sort((a, b) => rank(a) - rank(b) || b.soldCount - a.soldCount)
    .slice(0, limit);
}

export async function getRelated(p: Product, limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return PRODUCTS.filter((x) => live(x) && x.category === p.category && x.slug !== p.slug)
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, limit);
}

export type SortKey = "newest" | "best" | "price-asc" | "price-desc";

export type ShopQuery = {
  category?: CategorySlug;
  q?: string;
  sub?: string[];
  max?: number;
  sale?: boolean;
  custom?: boolean;
  occasion?: string;
  sort?: SortKey;
  page?: number;
};

export const PAGE_SIZE = 12;
export const PRICE_MIN = 500;
export const PRICE_MAX = 15000;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/nikah/g, "nikkah")
    .replace(/jewelry/g, "jewellery");

function matches(p: Product, q: string) {
  const hay = norm(
    [p.name, p.description, p.subcategory, p.category, ...(p.occasions ?? []), ...(p.colours ?? []).map((c) => c.name)]
      .filter(Boolean)
      .join(" "),
  );
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")));
}

/**
 * Shop search + filters. Runs on the server per request (searchParams are runtime data).
 * Phase 2: replace with a Postgres query (full-text + pg_trgm) using the same ShopQuery shape.
 */
export async function searchProducts(query: ShopQuery) {
  const all = await getProducts();
  let items = all.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.sub?.length && (!p.subcategory || !query.sub.includes(p.subcategory))) return false;
    if (query.max && productPrice(p).price > query.max) return false;
    if (query.sale && !productPrice(p).onSale) return false;
    if (query.custom && !p.customisable) return false;
    if (query.occasion && !p.occasions.includes(query.occasion as Product["occasions"][number])) return false;
    if (query.q && !matches(p, query.q)) return false;
    return true;
  });

  const sort = query.sort ?? "newest";
  items = items.sort((a, b) => {
    switch (sort) {
      case "best":
        return b.soldCount - a.soldCount;
      case "price-asc":
        return productPrice(a).price - productPrice(b).price;
      case "price-desc":
        return productPrice(b).price - productPrice(a).price;
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const page = Math.max(1, query.page ?? 1);
  const shown = Math.min(items.length, page * PAGE_SIZE);
  return { items: items.slice(0, shown), total: items.length, shown, page, hasMore: shown < items.length };
}

/** Parse URL search params into a ShopQuery (shared by the shop pages). */
export function parseShopQuery(sp: Record<string, string | string[] | undefined>, category?: CategorySlug): ShopQuery {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const many = (k: string) => {
    const v = sp[k];
    if (!v) return [];
    return (Array.isArray(v) ? v : v.split(",")).filter(Boolean);
  };
  const max = Number(one("max"));
  const sort = one("sort") as SortKey | undefined;
  return {
    category,
    q: one("q")?.slice(0, 80) || undefined,
    sub: many("sub"),
    max: Number.isFinite(max) && max >= PRICE_MIN && max < PRICE_MAX ? max : undefined,
    sale: one("sale") === "1",
    custom: one("custom") === "1",
    occasion: one("occasion") || undefined,
    sort: sort && ["newest", "best", "price-asc", "price-desc"].includes(sort) ? sort : undefined,
    page: Number(one("page")) || 1,
  };
}
