import { expect, test, type Page } from "@playwright/test";
import dotenv from "dotenv";
import { Pool } from "pg";
import { settle } from "../helpers";

dotenv.config({ path: ".env.local", quiet: true });

const db = new Pool({ connectionString: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL });
const EMAIL = process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "studio-pass-2026";

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function stubWhatsApp(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __waUrl: string | null }).__waUrl = null;
    window.open = () => {
      const tab = {
        close() {},
        location: {
          set href(value: string) {
            (window as unknown as { __waUrl: string | null }).__waUrl = value;
          },
        },
      };
      return tab as unknown as Window;
    };
  });
}

async function addProduct(page: Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("link", { name: /Added/ })).toBeVisible();
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function addProductWithReference(page: Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await settle(page);
  await page.locator('input[type="file"]').setInputFiles({ name: "reference.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Reference photo attached")).toBeVisible();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("link", { name: /Added/ })).toBeVisible();
}

async function checkout(page: Page, phone: string, city = "Lahore") {
  await page.goto("/cart");
  await page.fill('input[name="name"]', "Checkout Tester");
  await page.fill('input[name="phone"]', phone);
  await page.selectOption('select[name="city"]', city);
  await page.fill('textarea[name="address"]', "House 12, Street 4, Gulberg");
  await page.getByRole("button", { name: "Place order on WhatsApp" }).click();
  await expect(page).toHaveURL(/\/thank-you\?order=/);
  await page.waitForFunction(() => Boolean((window as unknown as { __waUrl?: string }).__waUrl));
  const orderId = decodeURIComponent(new URL(page.url()).searchParams.get("order") ?? "");
  expect(orderId).toMatch(/^RBA-\d+$/);
  return orderId;
}

test("checkout saves server-priced order lines, customer, WhatsApp message and clears the cart", async ({ page }, testInfo) => {
  await stubWhatsApp(page);
  const phone = testInfo.project.name === "mobile" ? "03001234001" : "03001234002";
  await db.query('DELETE FROM "Order" WHERE phone = $1', [phone]);
  await db.query('DELETE FROM "Customer" WHERE phone = $1', [phone]);

  await addProductWithReference(page, "gold-leaf-nikkah-tray-pen-set");
  await addProduct(page, "pressed-rose-earrings");
  // Tamper with the display prices: the server must ignore them.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("rba-cart-v1") ?? "[]");
    localStorage.setItem("rba-cart-v1", JSON.stringify(raw.map((line: object) => ({ ...line, unitPrice: 1, unitWas: 1 }))));
  });
  await page.reload();
  const orderId = await checkout(page, phone);

  const wa = await page.evaluate(() => (window as unknown as { __waUrl: string }).__waUrl);
  expect(wa).toContain("https://wa.me/");
  expect(decodeURIComponent(wa)).toContain(orderId);
  const order = await db.query(
    `SELECT o.number, o.total, o.subtotal, o.delivery, o.status, o."whatsappMessage", c.id AS customer_id,
            (SELECT count(*)::int FROM "OrderLine" l WHERE l."orderId" = o.id) AS lines
     FROM "Order" o JOIN "Customer" c ON c.id = o."customerId" WHERE c.phone = $1 ORDER BY o."createdAt" DESC LIMIT 1`,
    [phone],
  );
  expect(order.rowCount).toBe(1);
  const row = order.rows[0];
  expect(`RBA-${row.number}`).toBe(orderId);
  expect(row.lines).toBe(2);
  expect(row.status).toBe("NEW");
  expect(row.total).toBeGreaterThan(100);
  expect(row.subtotal + row.delivery).toBe(row.total);
  expect(row.whatsappMessage.length).toBeLessThanOrEqual(1500);
  expect(row.whatsappMessage).toContain(orderId);
  expect(row.whatsappMessage).toContain("Total: Rs");
  const ref = await db.query(
    `SELECT l.personalisation->>'referenceImage' AS image FROM "OrderLine" l JOIN "Order" o ON o.id = l."orderId"
     WHERE o.number = $1 AND l.personalisation->>'referenceImage' IS NOT NULL LIMIT 1`,
    [row.number],
  );
  expect(ref.rows[0]?.image).toMatch(/^\/uploads\/[\w.-]+$/);
  expect(await page.evaluate(() => localStorage.getItem("rba-cart-v1"))).toBe("[]");

  // Same phone again: one customer, two orders.
  await addProduct(page, "pressed-rose-earrings");
  await checkout(page, phone);
  const customers = await db.query('SELECT count(*)::int AS n FROM "Customer" WHERE phone = $1', [phone]);
  const orders = await db.query('SELECT count(*)::int AS n FROM "Order" WHERE phone = $1', [phone]);
  expect(customers.rows[0].n).toBe(1);
  expect(orders.rows[0].n).toBe(2);
});

test("the sixth order in an hour from one phone is blocked with a friendly message", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Rate limit is checked once");
  const phone = "03001234009";
  await db.query('DELETE FROM "Order" WHERE phone = $1', [phone]);
  await db.query('DELETE FROM "Customer" WHERE phone = $1', [phone]);
  const customer = await db.query('INSERT INTO "Customer" (id, name, phone, city, address, "updatedAt") VALUES ($1, $2, $3, $4, $5, now()) RETURNING id', [
    "rate-limit-customer",
    "Rate Tester",
    phone,
    "Lahore",
    "House 1",
  ]);
  for (let i = 0; i < 5; i += 1) {
    await db.query(
      `INSERT INTO "Order" (id, number, "customerId", name, phone, city, address, subtotal, savings, delivery, total, "whatsappMessage", status, "updatedAt")
       VALUES ($1, nextval('order_number_seq'), $2, $3, $4, $5, $6, 0, 0, 0, 0, '', 'NEW', now())`,
      [`rate-order-${i}`, customer.rows[0].id, "Rate Tester", phone, "Lahore", "House 1"],
    );
  }
  await stubWhatsApp(page);
  await addProduct(page, "pressed-rose-earrings");
  await page.goto("/cart");
  await page.fill('input[name="name"]', "Rate Tester");
  await page.fill('input[name="phone"]', phone);
  await page.selectOption('select[name="city"]', "Lahore");
  await page.fill('textarea[name="address"]', "House 12, Street 4, Gulberg");
  await page.getByRole("button", { name: "Place order on WhatsApp" }).click();
  await expect(page.getByText("Too many orders from this number")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/cart");
});

test("admin sees the order, changes status with an event, and exports CSV", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Admin order flow is checked once");
  const phone = "03001234002";
  const latest = await db.query('SELECT id, number FROM "Order" WHERE phone = $1 ORDER BY "createdAt" DESC LIMIT 1', [phone]);
  const orderId = `RBA-${latest.rows[0].number}`;
  await login(page);
  await page.goto("/admin/orders");
  await expect(page.getByRole("link", { name: orderId })).toBeVisible();
  await page.goto(`/admin/orders/${orderId}`);
  await expect(page.locator("h1")).toContainText(orderId);
  await page.selectOption('select[name="status"]', "Confirmed");
  await expect(page.getByText("Confirmed on WhatsApp", { exact: false }).first()).toBeVisible();
  const after = await db.query('SELECT status FROM "Order" WHERE id = $1', [latest.rows[0].id]);
  expect(after.rows[0].status).toBe("CONFIRMED");
  const events = await db.query('SELECT label FROM "OrderEvent" WHERE "orderId" = $1', [latest.rows[0].id]);
  expect(events.rows.map((e) => e.label)).toContain("Confirmed on WhatsApp");

  await page.goto("/admin");
  await expect(page.getByText("To make")).toBeVisible();
  const csv = await page.request.get("/admin/orders/export.csv");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const text = await csv.text();
  expect(text).toContain("Order,Date,Customer,Phone,City");
  expect(text).toContain(orderId);
});
