import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  getCategoryByPath,
  getCategoryStaticParams,
  getProduct,
  searchProducts,
} from "@/lib/queries";
import { productPrice } from "@/lib/pricing";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

afterAll(async () => {
  await db.product.deleteMany({ where: { slug: { startsWith: "test-" } } });
  await db.$disconnect();
});

describe("searchProducts", () => {
  it("finds bangles for the typo 'bangel'", async () => {
    const { items } = await searchProducts({ q: "bangel" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((p) => /bangle/i.test(p.name))).toBe(true);
  });

  it("applies the nikah → nikkah synonym", async () => {
    const { items } = await searchProducts({ q: "nikah tray" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => /nikkah/i.test(p.name))).toBe(true);
  });

  it("includes child-category products when filtering by parent", async () => {
    const { items } = await searchProducts({ category: "jewellery" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.category === "jewellery")).toBe(true);
    expect(items.some((p) => p.subcategory === "Earrings")).toBe(true);
  });

  it("filters by max price, sale, customisable and occasion", async () => {
    const max = await searchProducts({ max: 1000 });
    expect(max.items.every((p) => productPrice(p).price <= 1000)).toBe(true);

    const sale = await searchProducts({ sale: true });
    expect(sale.items.length).toBeGreaterThan(0);
    expect(sale.items.every((p) => productPrice(p).onSale)).toBe(true);

    const custom = await searchProducts({ custom: true });
    expect(custom.items.length).toBeGreaterThan(0);
    expect(custom.items.every((p) => p.customisable)).toBe(true);

    const occasion = await searchProducts({ occasion: "Nikkah" });
    expect(occasion.items.length).toBeGreaterThan(0);
    expect(occasion.items.every((p) => p.occasions.includes("Nikkah"))).toBe(true);
  });

  it("sorts by newest, price and best selling", async () => {
    const newest = await searchProducts({ sort: "newest" });
    for (let i = 1; i < newest.items.length; i += 1) {
      expect(newest.items[i - 1].createdAt >= newest.items[i].createdAt).toBe(true);
    }

    const asc = await searchProducts({ sort: "price-asc" });
    for (let i = 1; i < asc.items.length; i += 1) {
      expect(productPrice(asc.items[i - 1]).price).toBeLessThanOrEqual(productPrice(asc.items[i]).price);
    }

    const desc = await searchProducts({ sort: "price-desc" });
    for (let i = 1; i < desc.items.length; i += 1) {
      expect(productPrice(desc.items[i - 1]).price).toBeGreaterThanOrEqual(productPrice(desc.items[i]).price);
    }

    const best = await searchProducts({ sort: "best" });
    expect(best.items.length).toBeGreaterThan(0);
  });

  it("loads more cumulatively and reports hasMore", async () => {
    const first = await searchProducts({ page: 1 });
    const second = await searchProducts({ page: 2 });
    expect(first.items).toHaveLength(12);
    expect(second.items).toHaveLength(Math.min(second.total, 24));
    expect(second.hasMore).toBe(second.total > 24);
  });

  it("never shows an expired sale", async () => {
    const earrings = await db.category.findFirst({ where: { slug: "earrings" } });
    expect(earrings).not.toBeNull();
    await db.product.create({
      data: {
        slug: "test-expired-sale",
        name: "Test Expired Sale",
        categoryId: earrings!.id,
        description: "test",
        details: "test",
        care: "test",
        price: 2000,
        salePrice: 1000,
        saleEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "LIVE",
      },
    });

    const onSale = await searchProducts({ category: "jewellery", sale: true });
    expect(onSale.items.some((p) => p.slug === "test-expired-sale")).toBe(false);
    const product = await getProduct("test-expired-sale");
    expect(product?.salePrice).toBeUndefined();
  });
});

describe("category paths", () => {
  it("returns the breadcrumb chain for a child category", async () => {
    const data = await getCategoryByPath("jewellery", "earrings");
    expect(data?.category.slug).toBe("earrings");
    expect(data?.parent?.slug).toBe("jewellery");
    expect(data?.category.parentSlug).toBe("jewellery");
    expect(data?.liveCount).toBeGreaterThan(0);
  });

  it("lists children on a top-level category", async () => {
    const data = await getCategoryByPath("jewellery");
    expect(data?.category.slug).toBe("jewellery");
    expect(data?.children.map((c) => c.slug)).toContain("earrings");
  });

  it("returns at least one static param and excludes hidden categories", async () => {
    const before = await getCategoryStaticParams();
    expect(before.length).toBeGreaterThan(0);

    const child = await db.category.findFirst({ where: { slug: "earrings" }, include: { parent: true } });
    expect(child?.parent).toBeTruthy();
    await db.category.update({ where: { id: child!.id }, data: { status: "HIDDEN" } });
    try {
      const hidden = await getCategoryByPath(child!.parent!.slug, "earrings");
      expect(hidden).toBeUndefined();
      const params = await getCategoryStaticParams();
      expect(params.some((p) => p.category === child!.parent!.slug && p.sub === "earrings")).toBe(false);
    } finally {
      await db.category.update({ where: { id: child!.id }, data: { status: "LIVE" } });
    }
  });
});
