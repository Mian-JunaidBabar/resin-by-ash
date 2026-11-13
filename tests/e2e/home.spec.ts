import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", quiet: true });

const db = new Pool({ connectionString: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL });

test.afterAll(async () => {
  await db.end();
});

async function revalidate(body: { tags?: string[]; paths?: string[] }) {
  const response = await fetch(`${process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100"}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.AUTH_SECRET}` },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(200);
}

const PINNED = [
  "gold-leaf-nikkah-tray-pen-set",
  "pressed-rose-earrings",
  "babys-breath-bangle",
  "petal-wall-clock",
  "name-keychain",
  "bridal-bouquet-block",
  "nikkah-pen-pair",
  "initial-heart-pendant",
];

test("reviews come from the database", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ayesha, Lahore")).toBeVisible();
});

test("admin edits the hero headline and the home page updates without a deploy", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk");
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "studio-pass-2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/home");
  await page.locator("#home-form").waitFor();
  const headline = page.locator('input[name="heroHeadline"]');
  await headline.fill("Poured for you");
  await page.locator('#home-form button[type="submit"]').last().click();
  await expect
    .poll(async () => (await db.query(`SELECT "heroHeadline" FROM "HomeContent" WHERE id = 1`)).rows[0].heroHeadline)
    .toBe("Poured for you");

  try {
    await expect
      .poll(
        async () => {
          await page.goto("/");
          return page.getByRole("heading", { level: 1 }).innerText();
        },
        { timeout: 20_000 },
      )
      .toContain("Poured for you");
  } finally {
    await db.query(`UPDATE "HomeContent" SET "heroHeadline" = 'Keepsakes, poured', "updatedAt" = now() WHERE id = 1`);
    await revalidate({ tags: ["home"] });
  }
});

test("seasonal hero shows inside its window and the default returns outside it", async ({ page }) => {
  const [from, to] = [new Date(Date.now() - 86_400_000), new Date(Date.now() + 86_400_000)];
  try {
    await db.query(
      `UPDATE "HomeContent" SET "seasonalHeadline" = 'Wedding season is here', "seasonalFrom" = $1, "seasonalTo" = $2, "updatedAt" = now() WHERE id = 1`,
      [from, to],
    );
    await revalidate({ tags: ["home"] });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wedding season is here");

    await db.query(
      `UPDATE "HomeContent" SET "seasonalFrom" = '2020-01-01T00:00:00Z', "seasonalTo" = '2020-02-01T00:00:00Z', "updatedAt" = now() WHERE id = 1`,
    );
    await revalidate({ tags: ["home"] });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Keepsakes, poured");
  } finally {
    await db.query(
      `UPDATE "HomeContent" SET "seasonalHeadline" = NULL, "seasonalImageUrl" = NULL, "seasonalFrom" = NULL, "seasonalTo" = NULL, "updatedAt" = now() WHERE id = 1`,
    );
    await revalidate({ tags: ["home"] });
  }
});

test("best sellers follow sales after every pin is removed", async ({ page }) => {
  const customerId = randomUUID();
  const orderId = randomUUID();
  const lineId = randomUUID();
  try {
    await db.query(`UPDATE "Product" SET "pinnedBestSeller" = false, "pinOrder" = NULL`);
    await db.query(
      `INSERT INTO "Customer" (id, name, phone, city, address, "createdAt", "updatedAt") VALUES ($1, 'E2E Buyer', '03000000000', 'Lahore', 'Test', now(), now())`,
      [customerId],
    );
    await db.query(
      `INSERT INTO "Order" (id, "customerId", name, phone, city, address, subtotal, savings, delivery, total, payment, status, "whatsappMessage", "createdAt", "updatedAt")
       VALUES ($1, $2, 'E2E Buyer', '03000000000', 'Lahore', 'Test', 9000, 0, 0, 9000, 'COD', 'CONFIRMED', 'e2e', now(), now())`,
      [orderId, customerId],
    );
    const product = await db.query<{ id: string; name: string; price: number }>(
      `SELECT id, name, price FROM "Product" WHERE slug = 'lavender-studs'`,
    );
    await db.query(
      `INSERT INTO "OrderLine" (id, "orderId", "productId", name, qty, "unitPrice", "unitWas", personalisation)
       VALUES ($1, $2, $3, $4, 10, $5, $5, '{}')`,
      [lineId, orderId, product.rows[0].id, product.rows[0].name, product.rows[0].price],
    );
    await revalidate({ tags: ["products", "orders"] });

    await page.goto("/");
    const best = page.locator("section", { has: page.getByRole("heading", { name: "Best sellers" }) });
    await expect(best.locator('a[href^="/product/"] h3').first()).toHaveText(product.rows[0].name);
  } finally {
    await db.query(`DELETE FROM "OrderEvent" WHERE "orderId" = $1`, [orderId]);
    await db.query(`DELETE FROM "OrderLine" WHERE "orderId" = $1`, [orderId]);
    await db.query(`DELETE FROM "Order" WHERE id = $1`, [orderId]);
    await db.query(`DELETE FROM "Customer" WHERE id = $1`, [customerId]);
    for (const [index, slug] of PINNED.entries()) {
      await db.query(`UPDATE "Product" SET "pinnedBestSeller" = true, "pinOrder" = $1 WHERE slug = $2`, [index, slug]);
    }
    await revalidate({ tags: ["products", "orders"] });
  }
});

test("a category with showOnHome off disappears from the home tiles", async ({ page }) => {
  try {
    await db.query(`UPDATE "Category" SET "showOnHome" = false, "updatedAt" = now() WHERE slug = 'keychains' AND "parentId" IS NULL`);
    await revalidate({ tags: ["categories"] });
    await page.goto("/");
    const tiles = page.locator("section", { has: page.getByRole("heading", { name: "Find your keepsake" }) });
    await expect(tiles.locator('a[href="/shop/keychains"]')).toHaveCount(0);
  } finally {
    await db.query(`UPDATE "Category" SET "showOnHome" = true, "updatedAt" = now() WHERE slug = 'keychains' AND "parentId" IS NULL`);
    await revalidate({ tags: ["categories"] });
  }
});

test("an unpublished review disappears from the home page", async ({ page }) => {
  const review = await db.query<{ id: string; caption: string }>(
    `SELECT id, caption FROM "Review" WHERE published = true ORDER BY "sortOrder" LIMIT 1`,
  );
  const { id, caption } = review.rows[0];
  try {
    await db.query(`UPDATE "Review" SET published = false WHERE id = $1`, [id]);
    await revalidate({ tags: ["home"] });
    await page.goto("/");
    await expect(page.getByText(caption)).toHaveCount(0);
  } finally {
    await db.query(`UPDATE "Review" SET published = true WHERE id = $1`, [id]);
    await revalidate({ tags: ["home"] });
  }
});
