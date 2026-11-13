import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Prisma as PrismaTypes } from "@/lib/generated/prisma/client";
import { productPrice } from "@/lib/pricing";
import type {
  Category,
  CategoryFaq,
  CategorySlug,
  DeliveryZone,
  Occasion,
  PersonalisationField,
  Product,
  ProductStatus,
  StoreSettings,
  VariantOption,
} from "@/lib/types";

/**
 * Read layer for the storefront.
 *
 * Every shared read is cached with a tag so admin mutations can call
 * revalidateTag() after a save. Product reads use cacheLife("hours"), which is
 * also the maximum window in which an expired sale can still be shown: the
 * sale window is evaluated when the cache entry is written, and the entry
 * naturally rolls over within an hour.
 */

const PAGE_SIZE = 12;
const PRICE_MIN = 500;
const PRICE_MAX = 15000;

const productInclude = {
  category: { include: { parent: true } },
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { position: "asc" as const } },
};

type ProductRow = PrismaTypes.ProductGetPayload<{ include: typeof productInclude }>;
type CategoryRow = PrismaTypes.CategoryGetPayload<object>;

/** Start of "today" in Asia/Karachi (UTC+5, no DST). */
function karachiToday(): Date {
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 5 * 60 * 60 * 1000,
  );
}

function saleIsActive(saleEndsAt: Date | null): boolean {
  return saleEndsAt == null || saleEndsAt >= karachiToday();
}

function variantOption(v: ProductRow["variants"][number]): VariantOption {
  return {
    name: v.name,
    ...(v.priceDelta ? { priceDelta: v.priceDelta } : {}),
    ...(v.swatch ? { swatch: v.swatch } : {}),
  };
}

function mapProduct(row: ProductRow): Product {
  const parent = row.category.parent;
  const chain = [
    ...(parent ? [{ slug: parent.slug, name: parent.name, shortName: parent.shortName }] : []),
    { slug: row.category.slug, name: row.category.name, shortName: row.category.shortName },
  ];
  const top = parent ?? row.category;
  const saleLive = saleIsActive(row.saleEndsAt);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: top.slug,
    categoryId: row.categoryId,
    categoryPath: chain,
    subcategory: parent ? row.category.name : undefined,
    description: row.description,
    details: row.details,
    care: row.care,
    price: row.price,
    salePrice: saleLive ? (row.salePrice ?? undefined) : undefined,
    saleEndsAt: saleLive ? (row.saleEndsAt?.toISOString() ?? undefined) : undefined,
    images: row.images.map((i) => i.url),
    tone: [row.toneBg, row.toneAccent],
    customisable: row.customisable,
    personalisation: row.personalisation as PersonalisationField[],
    sizes: row.variants.filter((v) => v.kind === "size").map(variantOption),
    colours: row.variants.filter((v) => v.kind === "colour").map(variantOption),
    occasions: row.occasions as Occasion[],
    leadTime: row.leadTime,
    pinnedBestSeller: row.pinnedBestSeller,
    showInLatest: row.showInLatest,
    soldCount: 0,
    createdAt: row.createdAt.toISOString(),
    status: row.status.toLowerCase() as ProductStatus,
  };
}

function mapCategory(row: CategoryRow & { children?: CategoryRow[] }): Category {
  const children = (row.children ?? []).map((c) => ({
    slug: c.slug,
    name: c.name,
    shortName: c.shortName,
  }));
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    h1: row.h1 ?? undefined,
    metaTitle: row.metaTitle ?? undefined,
    intro: row.intro,
    seoDescription: row.metaDescription ?? "",
    seoContent: row.seoContent ?? undefined,
    faq: (row.faq as CategoryFaq[] | null) ?? undefined,
    subcategories: children.map((c) => c.name),
    children,
    showOnHome: row.showOnHome,
    showInFooter: row.showInFooter,
    sortOrder: row.sortOrder,
    tone: row.tone,
    image: row.imageUrl ?? undefined,
    ogImage: row.ogImageUrl ?? undefined,
    status: row.status,
  };
}

/* ───────────────────────── Categories ───────────────────────── */

/** All LIVE top-level categories, each with its LIVE children. */
export async function getCategoryTree(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  const rows = await db.category.findMany({
    where: { parentId: null, status: "LIVE" },
    orderBy: { sortOrder: "asc" },
    include: { children: { where: { status: "LIVE" }, orderBy: { sortOrder: "asc" } } },
  });
  return rows.map(mapCategory);
}

/** Kept for the home page and shop chips. */
export async function getCategories(): Promise<Category[]> {
  return getCategoryTree();
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  const row = await db.category.findFirst({
    where: { slug, parentId: null, status: "LIVE" },
    include: { children: { where: { status: "LIVE" }, orderBy: { sortOrder: "asc" } } },
  });
  return row ? mapCategory(row) : undefined;
}

export type CategoryPageData = {
  category: Category;
  parent?: Category;
  children: Category[];
  liveCount: number;
};

/**
 * Resolve /shop/{parent} or /shop/{parent}/{child} to a LIVE category.
 * Hidden categories are treated as missing so the caller can fall back to a
 * CategoryRedirect or a 404.
 */
export async function getCategoryByPath(parentSlug: string, childSlug?: string): Promise<CategoryPageData | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const top = await db.category.findFirst({
    where: { slug: parentSlug, parentId: null, status: "LIVE" },
    include: { children: { where: { status: "LIVE" }, orderBy: { sortOrder: "asc" } } },
  });
  if (!top) return undefined;
  cacheTag(`category:${top.id}`);

  if (childSlug) {
    const child = top.children.find((c) => c.slug === childSlug);
    if (!child) return undefined;
    const liveCount = await db.product.count({ where: { status: "LIVE", categoryId: child.id } });
    return {
      category: { ...mapCategory({ ...child, children: [] }), parentSlug: top.slug },
      parent: mapCategory(top),
      children: [],
      liveCount,
    };
  }

  const ids = [top.id, ...top.children.map((c) => c.id)];
  const liveCount = await db.product.count({ where: { status: "LIVE", categoryId: { in: ids } } });
  return { category: mapCategory(top), children: top.children.map(mapCategory), liveCount };
}

/** Every LIVE category path, for generateStaticParams(). */
export async function getCategoryStaticParams(): Promise<{ category: string; sub?: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  const tops = await db.category.findMany({
    where: { parentId: null, status: "LIVE" },
    orderBy: { sortOrder: "asc" },
    include: { children: { where: { status: "LIVE" }, orderBy: { sortOrder: "asc" } } },
  });
  return tops.flatMap((top) => [
    { category: top.slug },
    ...top.children.map((child) => ({ category: top.slug, sub: child.slug })),
  ]);
}

/** Old-slug lookup used by renamed categories. Returns the new /shop path. */
export async function getCategoryRedirect(fromPath: string): Promise<string | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  const redirect = await db.categoryRedirect.findUnique({
    where: { fromPath },
    include: { category: { include: { parent: true } } },
  });
  if (!redirect) return undefined;
  const c = redirect.category;
  return c.parent ? `/shop/${c.parent.slug}/${c.slug}` : `/shop/${c.slug}`;
}

/* ───────────────────────── Products ───────────────────────── */

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const rows = await db.product.findMany({
    where: { status: "LIVE" },
    orderBy: { createdAt: "desc" },
    include: productInclude,
  });
  return rows.map(mapProduct);
}

export async function getProductStaticParams(): Promise<{ slug: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const rows = await db.product.findMany({ where: { status: "LIVE" }, select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${slug}`);
  const row = await db.product.findFirst({
    where: { slug, status: "LIVE" },
    include: productInclude,
  });
  return row ? mapProduct(row) : undefined;
}

/** Home "Latest arrivals": admin-picked pieces first, then newest. */
export async function getLatest(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const rows = await db.product.findMany({
    where: { status: "LIVE" },
    orderBy: [{ showInLatest: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: productInclude,
  });
  return rows.map(mapProduct);
}

/** Units sold in the last 90 days, counting CONFIRMED-or-later orders only. */
async function soldCounts(since: Date): Promise<Map<string, number>> {
  const rows = await db.orderLine.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: {
        status: { in: ["CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: since },
      },
    },
    _sum: { qty: true },
  });
  return new Map(rows.filter((r) => r.productId).map((r) => [r.productId!, r._sum.qty ?? 0]));
}

/** Best sellers: pinned pieces first (admin order), then units sold in the last 90 days. */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "orders");
  const rows = await db.product.findMany({ where: { status: "LIVE" }, include: productInclude });
  const sold = await soldCounts(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  return rows
    .map((row) => ({ row, product: { ...mapProduct(row), soldCount: sold.get(row.id) ?? 0 } }))
    .sort((a, b) => {
      const pa = a.product.pinnedBestSeller ? (a.row.pinOrder ?? 99) : 999;
      const pb = b.product.pinnedBestSeller ? (b.row.pinOrder ?? 99) : 999;
      return pa - pb || b.product.soldCount - a.product.soldCount || b.row.createdAt.getTime() - a.row.createdAt.getTime();
    })
    .slice(0, limit)
    .map((x) => x.product);
}

/** Related pieces: same child category first, then the rest of the parent category. */
export async function getRelated(p: Product, limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  if (!p.categoryId) return [];
  const category = await db.category.findUnique({ where: { id: p.categoryId } });
  if (!category) return [];
  const topId = category.parentId ?? category.id;
  const siblings = await db.category.findMany({ where: { parentId: topId }, select: { id: true } });
  const ids = [topId, ...siblings.map((s) => s.id)];
  const rows = await db.product.findMany({
    where: { status: "LIVE", slug: { not: p.slug }, categoryId: { in: ids } },
    include: productInclude,
  });
  const sold = await soldCounts(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  return rows
    .map((row) => ({ row, product: { ...mapProduct(row), soldCount: sold.get(row.id) ?? 0 } }))
    .sort((a, b) => {
      const sameA = a.row.categoryId === p.categoryId ? 0 : 1;
      const sameB = b.row.categoryId === p.categoryId ? 0 : 1;
      return (
        sameA - sameB ||
        b.product.soldCount - a.product.soldCount ||
        a.row.category.sortOrder - b.row.category.sortOrder ||
        a.product.name.localeCompare(b.product.name)
      );
    })
    .slice(0, limit)
    .map((x) => x.product);
}

/* ───────────────────────── Shop search ───────────────────────── */

export type SortKey = "newest" | "best" | "price-asc" | "price-desc";

export type ShopQuery = {
  /** Top-level category slug */
  category?: CategorySlug;
  /** Child category slug, scoped to `category` */
  child?: string;
  q?: string;
  /** Legacy Type filter (child category names) */
  sub?: string[];
  max?: number;
  sale?: boolean;
  custom?: boolean;
  occasion?: string;
  sort?: SortKey;
  page?: number;
};

export { PAGE_SIZE, PRICE_MIN, PRICE_MAX };

function normaliseSearch(query: string, synonyms: Record<string, string>): string {
  return query
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => synonyms[w] ?? w)
    .join(" ")
    .slice(0, 80);
}

async function matchingProductIds(q: string): Promise<string[]> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM "Product" p
    WHERE p.status = 'LIVE'
      AND (
        to_tsvector('simple', p.name || ' ' || p.description) @@ plainto_tsquery('simple', ${q})
        OR lower(p.name) LIKE '%' || lower(${q}) || '%'
        OR (position(' ' in ${q}) = 0 AND word_similarity(lower(${q}), lower(p.name)) >= 0.4)
      )
  `;
  return rows.map((r) => r.id);
}

/**
 * Shop search + filters. Runs on the server from URL searchParams.
 * Full-text search plus pg_trgm catches typos ("bangel" → bangles); synonyms
 * (nikah → nikkah, jewelry → jewellery) come from Settings.
 */
export async function searchProducts(query: ShopQuery) {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "categories", "settings");

  const settings = await getSettings();
  const today = karachiToday();
  const and: Prisma.ProductWhereInput[] = [{ status: "LIVE" }];

  if (query.category) {
    const top = await db.category.findFirst({
      where: { slug: query.category, parentId: null, status: "LIVE" },
      include: { children: { where: { status: "LIVE" }, select: { id: true, name: true, slug: true } } },
    });
    if (!top) return { items: [], total: 0, shown: 0, page: 1, hasMore: false };

    if (query.child) {
      const child = top.children.find((c) => c.slug === query.child);
      if (!child) return { items: [], total: 0, shown: 0, page: 1, hasMore: false };
      and.push({ categoryId: child.id });
    } else if (query.sub?.length) {
      const ids = top.children.filter((c) => query.sub!.includes(c.name)).map((c) => c.id);
      and.push({ categoryId: { in: ids } });
    } else {
      and.push({ OR: [{ categoryId: top.id }, { category: { parentId: top.id } }] });
    }
  }

  if (query.q) {
    const q = normaliseSearch(query.q, settings.searchSynonyms);
    const ids = await matchingProductIds(q);
    and.push({ id: { in: ids } });
  }

  if (query.max) and.push({ price: { lte: query.max } });
  if (query.custom) and.push({ customisable: true });
  if (query.occasion) and.push({ occasions: { has: query.occasion } });
  if (query.sale) {
    and.push({ salePrice: { not: null } }, { OR: [{ saleEndsAt: null }, { saleEndsAt: { gte: today } }] });
  }

  const rows = await db.product.findMany({
    where: { AND: and },
    include: productInclude,
  });

  const sold = query.sort === "best" ? await soldCounts(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) : new Map<string, number>();
  const items = rows.map((row) => ({ ...mapProduct(row), soldCount: sold.get(row.id) ?? 0 }));
  const sort = query.sort ?? "newest";

  items.sort((a, b) => {
    switch (sort) {
      case "best":
        return b.soldCount - a.soldCount || b.createdAt.localeCompare(a.createdAt);
      case "price-asc":
        return productPrice(a).price - productPrice(b).price;
      case "price-desc":
        return productPrice(b).price - productPrice(a).price;
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const page = Math.max(1, query.page ?? 1);
  const total = items.length;
  const shown = Math.min(total, page * PAGE_SIZE);
  return { items: items.slice(0, shown), total, shown, page, hasMore: shown < total };
}

/** Parse URL search params into a ShopQuery (shared by the shop pages). */
export function parseShopQuery(
  sp: Record<string, string | string[] | undefined>,
  category?: CategorySlug,
  child?: string,
): ShopQuery {
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
    child,
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

/* ───────────────────────── Settings + delivery ───────────────────────── */

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");
  const row = await db.settings.findUnique({ where: { id: 1 } });
  if (!row) {
    return {
      whatsappNumber: "920000000000",
      whatsappDisplay: "+92 3XX XXXXXXX",
      instagram: "",
      tiktok: "",
      studioHours: [],
      announcementOn: true,
      announcement: "",
      orderPrefix: "RBA-",
      defaultLeadTime: "5–7 working days",
      orderMessageTemplate: "",
      acceptCod: true,
      searchSynonyms: {},
      faq: [],
    };
  }
  let studioHours: { days: string; hours: string }[] = [];
  try {
    studioHours = JSON.parse(row.studioHours || "[]");
  } catch {
    studioHours = [];
  }
  return {
    whatsappNumber: row.whatsappNumber,
    whatsappDisplay: row.whatsappDisplay,
    instagram: row.instagram,
    tiktok: row.tiktok,
    studioHours,
    announcementOn: row.announcementOn,
    announcement: row.announcement,
    orderPrefix: row.orderPrefix,
    defaultLeadTime: row.defaultLeadTime,
    orderMessageTemplate: row.orderMessageTemplate,
    acceptCod: row.acceptCod,
    searchSynonyms: (row.searchSynonyms as Record<string, string> | null) ?? {},
    faq: (row.faq as StoreSettings["faq"] | null) ?? [],
    heroImageUrl: row.heroImageUrl ?? undefined,
    heroHeadline: row.heroHeadline ?? undefined,
  };
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("delivery");
  const rows = await db.deliveryZone.findMany({ orderBy: { position: "asc" } });
  return rows.map((z) => ({
    id: z.id,
    label: z.label,
    cities: z.cities,
    charge: z.charge,
    days: z.days,
    position: z.position,
  }));
}

/* ───────────────────────── Home content ───────────────────────── */

export type HomeContentData = {
  heroEyebrow: string;
  heroHeadline: string;
  heroHeadlineEm: string;
  heroSubcopy: string;
  heroImageUrl?: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  flowerHeadline: string;
  flowerCopy: string;
  flowerImageUrl?: string;
  steps: { title: string; text: string }[];
  seasonal?: { headline: string; imageUrl?: string; from: string; to: string };
};

export type HomeReview = { id: string; imageUrl?: string; caption: string; sortOrder: number };
export type HomeSocialTile = { id: string; label: string; href: string; imageUrl?: string; sortOrder: number };

/**
 * Everything editable on the home page. `seasonalActive` is evaluated when the
 * cache entry is written (cacheLife hours), so a seasonal window starts/ends
 * within an hour without a redeploy.
 */
export async function getHomeContent(): Promise<HomeContentData & { seasonalActive: boolean }> {
  "use cache";
  cacheLife("hours");
  cacheTag("home");
  const row = await db.homeContent.findUnique({ where: { id: 1 } });
  if (!row) {
    return {
      heroEyebrow: "Handmade resin studio · Pakistan",
      heroHeadline: "Keepsakes, poured",
      heroHeadlineEm: "by hand.",
      heroSubcopy: "Nikkah trays, jewellery and preserved flowers, each piece made one at a time by Ash.",
      primaryCtaLabel: "Shop now",
      primaryCtaHref: "/shop",
      secondaryCtaLabel: "Make it custom",
      secondaryCtaHref: "/custom",
      flowerHeadline: "Your wedding flowers, kept for good.",
      flowerCopy: "",
      steps: [],
      seasonalActive: false,
    };
  }

  const now = Date.now();
  const seasonal =
    row.seasonalHeadline && row.seasonalFrom && row.seasonalTo
      ? {
          headline: row.seasonalHeadline,
          imageUrl: row.seasonalImageUrl ?? undefined,
          from: row.seasonalFrom.toISOString(),
          to: row.seasonalTo.toISOString(),
        }
      : undefined;
  const seasonalActive = !!seasonal && now >= Date.parse(seasonal.from) && now <= Date.parse(seasonal.to);

  return {
    heroEyebrow: row.heroEyebrow,
    heroHeadline: row.heroHeadline,
    heroHeadlineEm: row.heroHeadlineEm,
    heroSubcopy: row.heroSubcopy,
    heroImageUrl: row.heroImageUrl ?? undefined,
    primaryCtaLabel: row.primaryCtaLabel,
    primaryCtaHref: row.primaryCtaHref,
    secondaryCtaLabel: row.secondaryCtaLabel,
    secondaryCtaHref: row.secondaryCtaHref,
    flowerHeadline: row.flowerHeadline,
    flowerCopy: row.flowerCopy,
    flowerImageUrl: row.flowerImageUrl ?? undefined,
    steps: (row.steps as { title: string; text: string }[]) ?? [],
    seasonal,
    seasonalActive,
  };
}

export async function getHomeReviews(): Promise<HomeReview[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("home");
  const rows = await db.review.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return rows.map((r) => ({ id: r.id, imageUrl: r.imageUrl ?? undefined, caption: r.caption, sortOrder: r.sortOrder }));
}

export async function getHomeSocialTiles(): Promise<HomeSocialTile[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("home");
  const rows = await db.socialTile.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return rows.map((r) => ({ id: r.id, label: r.label, href: r.href, imageUrl: r.imageUrl ?? undefined, sortOrder: r.sortOrder }));
}
