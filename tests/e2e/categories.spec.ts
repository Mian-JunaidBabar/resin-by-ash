import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const databaseUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
const db = new Pool({ connectionString: databaseUrl! });

test.afterAll(async () => {
  await db.end();
});

async function revalidate(tags: string[], paths: string[] = []) {
  const response = await fetch(`${process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100"}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.AUTH_SECRET}`,
    },
    body: JSON.stringify({ tags, paths }),
  });
  expect(response.status).toBe(200);
}

test("top category links to its child category", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The desktop Type links are the child-category entry point");
  await page.goto("/shop/jewellery");
  await page.getByRole("link", { name: "Earrings", exact: true }).first().click();
  await expect(page).toHaveURL(/\/shop\/jewellery\/earrings$/);
  await expect(page.getByRole("heading", { level: 1, name: "Earrings" })).toBeVisible();
});

test("child category shows only its own products and a canonical URL", async ({ page }) => {
  await page.goto("/shop/jewellery/earrings?max=3000");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Earrings");

  await expect(page.locator('main a[href^="/product/"]').first()).toBeVisible();
  const links = await page.locator('main a[href^="/product/"]').evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  expect(links.length).toBeGreaterThan(0);
  expect(links.every((href) => /pressed-rose-earrings|gold-flake-hoops|lavender-studs/.test(href))).toBe(true);

  await expect(page).toHaveTitle("Earrings · Handmade resin in Pakistan");
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("Shop handmade resin earrings in Pakistan");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBe("http://127.0.0.1:3100/shop/jewellery/earrings");
});

test("category page has one h1 and valid collection JSON-LD", async ({ page }) => {
  await page.goto("/shop/jewellery");
  await expect(page.locator("h1")).toHaveCount(1);

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const data = blocks.flatMap((block) => {
    const parsed = JSON.parse(block);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
  const types = data.map((d) => d["@type"]);
  expect(types).toContain("CollectionPage");
  expect(types).toContain("BreadcrumbList");
  expect(types).toContain("ItemList");

  const collection = data.find((d) => d["@type"] === "CollectionPage");
  expect(collection.url).toBe("http://127.0.0.1:3100/shop/jewellery");
  expect(collection.description).toBeTruthy();
});

test("a new category appears after revalidation and is noindexed while empty", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Database lifecycle is covered once on desktop");
  const slug = `smoke-category-${testInfo.project.name}`;
  const categoryId = randomUUID();
  await db.query(
    `INSERT INTO "Category" (id, slug, name, "shortName", h1, intro, "metaTitle", "metaDescription", "seoContent", "sortOrder", status, "createdAt", "updatedAt")
     VALUES ($1, $2, 'Smoke Category', 'Smoke', 'Smoke Category', 'Smoke test intro', 'Smoke Category · Handmade resin in Pakistan', 'Smoke test category description', '## Smoke category\n\nSmoke test SEO copy.', 99, 'LIVE', now(), now())`,
    [categoryId, slug],
  );

  try {
    await revalidate(["categories"]);

    const pageResponse = await page.goto(`/shop/${slug}`);
    expect(pageResponse?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Smoke Category");
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);

    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain(`/shop/${slug}`);

    // Rename the slug and leave a redirect from the old path.
    const renamed = `${slug}-renamed`;
    await db.query(`UPDATE "Category" SET slug = $1, "updatedAt" = now() WHERE id = $2`, [renamed, categoryId]);
    await db.query(`INSERT INTO "CategoryRedirect" (id, "fromPath", "categoryId", "createdAt") VALUES ($1, $2, $3, now())`, [
      randomUUID(),
      `/shop/${slug}`,
      categoryId,
    ]);
    await revalidate(["categories"], [`/shop/${slug}`]);

    // revalidatePath uses stale-while-revalidate: the first request triggers
    // regeneration, the next one is served from the fresh route cache.
    let oldPath: Awaited<ReturnType<typeof request.get>> | undefined;
    await expect
      .poll(async () => {
        oldPath = await request.get(`/shop/${slug}`, { maxRedirects: 0 });
        return oldPath.status();
      })
      .toBe(308);
    expect(oldPath!.headers()["location"]).toContain(`/shop/${renamed}`);

    const newSitemap = await request.get("/sitemap.xml");
    const xml = await newSitemap.text();
    expect(xml).toContain(`/shop/${renamed}`);
    expect(xml).not.toContain(`/shop/${slug}<`);

    // Hiding it makes the URL a 404.
    await db.query(`UPDATE "Category" SET status = 'HIDDEN', "updatedAt" = now() WHERE id = $1`, [categoryId]);
    await db.query(`DELETE FROM "CategoryRedirect" WHERE "categoryId" = $1`, [categoryId]);
    await revalidate(["categories"], [`/shop/${renamed}`]);
    await expect
      .poll(async () => (await request.get(`/shop/${renamed}`, { maxRedirects: 0 })).status())
      .toBe(404);
  } finally {
    await db.query(`DELETE FROM "CategoryRedirect" WHERE "categoryId" = $1`, [categoryId]);
    await db.query(`DELETE FROM "Category" WHERE id = $1`, [categoryId]);
    await revalidate(["categories"], [`/shop/${slug}`, `/shop/${slug}-renamed`]);
  }
});
