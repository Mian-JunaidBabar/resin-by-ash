import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";

const url = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_TEST (or DATABASE_URL) is required");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

afterAll(async () => {
  await db.$disconnect();
});

describe("seed", () => {
  it("creates the six top-level categories and their children", async () => {
    const tops = await db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" } });
    expect(tops).toHaveLength(6);
    expect(tops.map((c) => c.slug)).toEqual([
      "nikkah",
      "jewellery",
      "flower-preservation",
      "keychains",
      "watches-clocks",
      "gifts",
    ]);

    const children = await db.category.findMany({ where: { parentId: { not: null } } });
    // 19 rows, 17 unique slugs: "Trays" and "Frames" each exist under two parents
    // (the catalogue reuses those subcategory names).
    expect(children).toHaveLength(19);
    expect(new Set(children.map((c) => c.slug)).size).toBe(17);
  });

  it("gives every category its own SEO fields", async () => {
    const categories = await db.category.findMany();
    for (const c of categories) {
      expect(c.h1, c.slug).toBeTruthy();
      expect(c.metaTitle, c.slug).toBeTruthy();
      expect(c.metaDescription, c.slug).toBeTruthy();
      expect(c.seoContent, c.slug).toContain("##");
    }
  });

  it("seeds 27 live products and one draft, all categorised", async () => {
    expect(await db.product.count({ where: { status: "LIVE" } })).toBe(27);
    expect(await db.product.count({ where: { status: "DRAFT" } })).toBe(1);

    const uncategorised = await db.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM "Product" WHERE "categoryId" IS NULL`;
    expect(Number(uncategorised[0].count)).toBe(0);

    const products = await db.product.findMany({ include: { category: true } });
    for (const p of products) expect(p.category, p.slug).toBeTruthy();
  });

  it("pins the eight best sellers in catalogue order", async () => {
    const pinned = await db.product.findMany({
      where: { pinnedBestSeller: true },
      orderBy: { pinOrder: "asc" },
      select: { slug: true, pinOrder: true },
    });
    expect(pinned).toHaveLength(8);
    expect(pinned[0].slug).toBe("gold-leaf-nikkah-tray-pen-set");
    expect(pinned[0].pinOrder).toBe(0);
  });

  it("seeds delivery zones, one settings row, home content and reviews", async () => {
    expect(await db.deliveryZone.count()).toBe(5);
    const settings = await db.settings.findUnique({ where: { id: 1 } });
    expect(settings).not.toBeNull();
    expect(settings?.whatsappNumber).toMatch(/^\d{10,15}$/);
    expect(settings?.faq).toBeTruthy();
    expect(await db.homeContent.count()).toBe(1);
    expect(await db.review.count()).toBe(6);
    expect(await db.socialTile.count()).toBe(6);
  });

  it("stores the owner password only as a bcrypt hash", async () => {
    const admins = await db.adminUser.findMany();
    expect(admins).toHaveLength(1);
    const admin = admins[0];
    expect(admin.email).toBe((process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk").toLowerCase());
    expect(admin.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(admin.passwordHash).not.toBe(process.env.ADMIN_PASSWORD);
    await expect(bcrypt.compare(process.env.ADMIN_PASSWORD ?? "", admin.passwordHash)).resolves.toBe(true);
  });

  it("starts order numbers at 1047", async () => {
    const rows = await db.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq')`;
    expect(Number(rows[0].nextval)).toBeGreaterThanOrEqual(1047);
  });
});
