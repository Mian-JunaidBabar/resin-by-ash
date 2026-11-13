import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", quiet: true });

const db = new Pool({ connectionString: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL });
const EMAIL = process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "studio-pass-2026";

test.describe.configure({ mode: "serial" });
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name === "mobile", "Catalogue is tested once on desktop"));
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function createTopCategory(page: Page, name: string, slug: string, seo: string) {
  await page.goto("/admin/categories/new");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="shortName"]', name);
  await page.fill('input[name="slug"]', slug);
  await page.fill('textarea[name="intro"]', `${name} intro from the catalogue test.`);
  await page.fill('input[name="metaTitle"]', `${name} · Handmade resin in Pakistan`);
  await page.fill('textarea[name="metaDescription"]', `${name} description from the catalogue test.`);
  await page.fill('textarea[name="seoContent"]', `## About ${name}\n\nSEO content for ${seo}.`);
  await page.fill('input[name="faqQ_0"]', `Is ${name} handmade?`);
  await page.fill('input[name="faqA_0"]', "Yes, every piece is poured by hand.");
  await page.uncheck('input[name="showOnHome"]');
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page).toHaveURL(/\/admin\/categories\/[^?]+\?saved=1/);
  return page.url().match(/\/admin\/categories\/([^?]+)/)![1];
}

test("create a category with SEO, then a child, and rename with a permanent redirect", async ({ page, request }) => {
  await login(page);
  const topId = await createTopCategory(page, "Gift Boxes", "gift-boxes", "gift boxes");

  await page.goto("/shop/gift-boxes");
  await expect(page.locator("h1")).toHaveText("Gift Boxes");
  await expect(page).toHaveTitle("Gift Boxes · Handmade resin in Pakistan");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Gift Boxes description from the catalogue test.");
  await expect(page.getByText("SEO content for gift boxes.")).toBeVisible();
  await expect(page.getByText("Is Gift Boxes handmade?")).toBeVisible();

  await page.goto("/");
  await expect(page.locator('a[href="/shop/gift-boxes"]')).toHaveCount(0);

  await expect
    .poll(async () => (await request.get("/sitemap.xml")).text())
    .toContain("/shop/gift-boxes");

  // Child category
  await page.goto("/admin/categories/new");
  await page.fill('input[name="name"]', "Eid Boxes");
  await page.fill('input[name="shortName"]', "Eid boxes");
  await page.selectOption('select[name="parentId"]', { label: "Gift Boxes" });
  await page.fill('textarea[name="intro"]', "Eid boxes under gift boxes.");
  await page.fill('input[name="metaTitle"]', "Eid Boxes · Handmade resin in Pakistan");
  await page.fill('textarea[name="metaDescription"]', "Handmade resin Eid boxes.");
  await page.fill('textarea[name="seoContent"]', "## Eid boxes");
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page).toHaveURL(/saved=1/);
  await page.goto("/shop/gift-boxes/eid-boxes");
  await expect(page.locator("h1")).toHaveText("Eid boxes");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Gift Boxes");

  // Rename the top slug
  await page.goto(`/admin/categories/${topId}`);
  await page.fill('input[name="slug"]', "gift-sets");
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page).toHaveURL(/saved=1/);
  await expect
    .poll(async () => (await request.get("/shop/gift-boxes", { maxRedirects: 0 })).status())
    .toBe(308);
  await expect
    .poll(async () => (await request.get("/sitemap.xml")).text())
    .toContain("/shop/gift-sets");
});

test("products: sale pricing, invalid sale rejection, images and blocked delete", async ({ page }) => {
  await login(page);
  const top = await db.query<{ id: string; name: string }>(`SELECT id, name FROM "Category" WHERE slug = 'gift-sets' AND "parentId" IS NULL`);
  const categoryId = top.rows[0].id;
  // The child category was already checked in the previous test; remove it so
  // the delete-blocked assertion is about the product.
  await db.query(`DELETE FROM "Category" WHERE slug = 'eid-boxes'`);

  // A valid sale product with three photos.
  const dir = await mkdtemp(path.join(tmpdir(), "rba-uploads-"));
  const files = ["one.png", "two.png", "three.png"].map((name) => path.join(dir, name));
  await Promise.all(files.map((file) => writeFile(file, PNG)));
  try {
    await page.goto("/admin/products/new");
    await page.fill('input[name="name"]', "E2E Gift Box");
    await page.selectOption('select[name="categoryId"]', categoryId);
    await page.fill('textarea[name="description"]', "A boxed gift from the catalogue test.");
    await page.fill('textarea[name="details"]', "Handmade.");
    await page.fill('textarea[name="care"]', "Wipe gently.");
    await page.fill('input[name="price"]', "1500");
    await page.fill('input[name="salePrice"]', "1200");
    await page.fill('input[name="saleEndsAt"]', "2027-12-31");
    await page.selectOption('select[name="status"]', "LIVE");
    await page.setInputFiles('input[name="photos"]', files);
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page).toHaveURL(/\/admin\/products\/e2e-gift-box\?saved=1/);

    const images = await db.query<{ id: string; url: string; position: number }>(
      `SELECT i.id, i.url, i.position FROM "ProductImage" i JOIN "Product" p ON p.id = i."productId" WHERE p.slug = 'e2e-gift-box' ORDER BY i.position`,
    );
    expect(images.rowCount).toBe(3);

    // Reorder: make the second photo the cover.
    await page.goto("/admin/products/e2e-gift-box");
    await page.fill(`input[name="imageOrder_${images.rows[0].id}"]`, "2");
    await page.fill(`input[name="imageOrder_${images.rows[1].id}"]`, "1");
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page).toHaveURL(/saved=1/);

    const reordered = await db.query<{ url: string }>(
      `SELECT i.url FROM "ProductImage" i JOIN "Product" p ON p.id = i."productId" WHERE p.slug = 'e2e-gift-box' ORDER BY i.position`,
    );
    expect(reordered.rows[0].url).toBe(images.rows[1].url);

    // Card shows the sale price and discount.
    await page.goto("/shop/gift-sets");
    const card = page.locator('a[href="/product/e2e-gift-box"]').first();
    await expect(card).toContainText("Rs 1,200");
    await expect(card).toContainText("-20%");

    // Delete is blocked while the category still has products.
    await page.goto(`/admin/categories/${categoryId}`);
    await page.getByRole("button", { name: "Delete category" }).click();
    await expect(page).toHaveURL(/error=inuse/);
    expect((await db.query(`SELECT count(*) FROM "Category" WHERE id = $1`, [categoryId])).rows[0].count).toBe("1");

    // An invalid sale is rejected and nothing is written.
    await page.goto("/admin/products/new");
    await page.fill('input[name="name"]', "Bad Sale Box");
    await page.selectOption('select[name="categoryId"]', categoryId);
    await page.fill('textarea[name="description"]', "Should not save.");
    await page.fill('input[name="price"]', "1500");
    await page.fill('input[name="salePrice"]', "1600");
    await page.fill('input[name="saleEndsAt"]', "2027-12-31");
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page).toHaveURL(/error=sale/);
    expect((await db.query(`SELECT count(*) FROM "Product" WHERE slug = 'bad-sale-box'`)).rows[0].count).toBe("0");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("admin catalogue pages pass axe", async ({ page }) => {
  await login(page);
  for (const url of ["/admin/categories", "/admin/categories/new", "/admin/products", "/admin/products/new"]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, `${url}: ${serious.map((v) => v.id).join(", ")}`).toHaveLength(0);
  }
});

test.afterAll(async () => {
  const products = await db.query<{ id: string; categoryId: string }>(`SELECT id, "categoryId" FROM "Product" WHERE slug IN ('e2e-gift-box', 'bad-sale-box')`);
  for (const p of products.rows) {
    await db.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [p.id]);
    await db.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1`, [p.id]);
    await db.query(`DELETE FROM "Product" WHERE id = $1`, [p.id]);
  }
  const child = await db.query<{ id: string }>(`SELECT id FROM "Category" WHERE slug = 'eid-boxes'`);
  for (const c of child.rows) await db.query(`DELETE FROM "Category" WHERE id = $1`, [c.id]);
  const tops = await db.query<{ id: string }>(`SELECT id FROM "Category" WHERE slug IN ('gift-boxes', 'gift-sets') AND "parentId" IS NULL`);
  for (const t of tops.rows) {
    await db.query(`DELETE FROM "CategoryRedirect" WHERE "categoryId" = $1`, [t.id]);
    await db.query(`DELETE FROM "Category" WHERE id = $1`, [t.id]);
  }
  await fetch(`${process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100"}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.AUTH_SECRET}` },
    body: JSON.stringify({ tags: ["categories", "products", "home"] }),
  }).catch(() => {});
  await db.end();
});
