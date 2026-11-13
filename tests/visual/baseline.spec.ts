import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { Pool } from "pg";
import { CART_TWO_ITEMS, LAST_ORDER, settle } from "../helpers";

dotenv.config({ path: ".env.local", quiet: true });
const db = new Pool({ connectionString: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL });

/**
 * Phase 0 visual baseline. Captures the finished frontend before the data layer
 * changes, so every later phase can prove the storefront still looks the same.
 */

test.beforeAll(async () => {
  // Deterministic admin order screens: clear test orders and seed one fixture.
  await db.query('DELETE FROM "Order"');
  await db.query('DELETE FROM "Customer" WHERE phone = $1', ["03009999999"]);
  const customer = await db.query(
    'INSERT INTO "Customer" (id, name, phone, city, address, "updatedAt") VALUES ($1, $2, $3, $4, $5, now()) RETURNING id',
    ["visual-customer", "Ayesha H.", "03009999999", "Lahore", "House 8, Street 2, Gulberg"],
  );
  const order = await db.query(
    `INSERT INTO "Order" (id, number, "customerId", name, phone, city, address, notes, subtotal, savings, delivery, total, "whatsappMessage", status, "updatedAt")
     VALUES ($1, 1042, $2, $3, $4, $5, $6, $7, 8300, 300, 250, 8250, $8, 'NEW', now()) RETURNING id`,
    [
      "visual-order",
      customer.rows[0].id,
      "Ayesha H.",
      "03009999999",
      "Lahore",
      "House 8, Street 2, Gulberg",
      "Please gift wrap the tray.",
      "Assalam o Alaikum Ash! New order from the website\n\nOrder: RBA-1042",
    ],
  );
  await db.query(
    `INSERT INTO "OrderLine" (id, "orderId", name, size, colour, personalisation, qty, "unitPrice", "unitWas") VALUES
     ($1, $2, $3, $4, $5, $6::jsonb, 1, 6800, 6800), ($7, $2, $8, $9, $10, $11::jsonb, 1, 1200, 1500)`,
    [
      "visual-line-1",
      order.rows[0].id,
      "Gold-leaf Nikkah Tray & Pen Set",
      "Large",
      "Ivory marble",
      JSON.stringify({ names: "Ayesha & Hamza", date: "2027-02-14", textColour: "Gold" }),
      "visual-line-2",
      "Pressed Rose Earrings",
      "Classic",
      "Blush rose",
      JSON.stringify({ text: "A & H", textColour: "Gold" }),
    ],
  );
  await db.query('INSERT INTO "OrderEvent" (id, "orderId", label) VALUES ($1, $2, $3)', [
    "visual-event",
    order.rows[0].id,
    "Order placed on site",
  ]);
});

test.afterAll(async () => {
  await db.query('DELETE FROM "Order" WHERE id = $1', ["visual-order"]);
  await db.query('DELETE FROM "Customer" WHERE id = $1', ["visual-customer"]);
  await db.end();
});

const STOREFRONT: [name: string, path: string][] = [
  ["home", "/"],
  ["shop-all", "/shop"],
  ["shop-jewellery", "/shop/jewellery"],
  ["product-pressed-rose-earrings", "/product/pressed-rose-earrings"],
  ["custom", "/custom"],
  ["thank-you", "/thank-you"],
  ["about", "/about"],
  ["faq", "/faq"],
  ["contact", "/contact"],
];

const ADMIN: [name: string, path: string][] = [
  ["admin-login", "/admin/login"],
  ["admin-dashboard", "/admin"],
  ["admin-home", "/admin/home"],
  ["admin-orders", "/admin/orders"],
  ["admin-order-detail", "/admin/orders/RBA-1042"],
  ["admin-products", "/admin/products"],
  ["admin-product-edit", "/admin/products/gold-leaf-nikkah-tray-pen-set"],
  ["admin-product-new", "/admin/products/new"],
  ["admin-categories", "/admin/categories"],
  ["admin-requests", "/admin/requests"],
  ["admin-customers", "/admin/customers"],
  ["admin-settings", "/admin/settings"],
  ["admin-users", "/admin/settings/users"],
];

for (const [name, path] of [...STOREFRONT, ...ADMIN]) {
  test(`${name} matches the visual baseline`, async ({ page }) => {
    if (name.startsWith("admin") && name !== "admin-login") {
      await page.goto("/admin/login");
      await page.fill('input[name="email"]', process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk");
      await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "studio-pass-2026");
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL(/\/admin$/);
    }
    await page.goto(path);
    if (name === "thank-you") {
      await page.evaluate((order) => sessionStorage.setItem("rba-last-order", JSON.stringify(order)), LAST_ORDER);
      await page.reload();
    }
    await settle(page);
    // Sticky sidebars render at the scroll position of a full-page capture and
    // make admin screenshots flaky. Freeze them in their natural flow position.
    await page.addStyleTag({ content: ".lg\\:sticky { position: static !important; }" });
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

test("cart empty matches the visual baseline", async ({ page }) => {
  await page.goto("/cart");
  await settle(page);
  await expect(page).toHaveScreenshot("cart-empty.png", { fullPage: true });
});

test("cart with two items matches the visual baseline", async ({ page }) => {
  await page.addInitScript((lines) => {
    localStorage.setItem("rba-cart-v1", JSON.stringify(lines));
  }, CART_TWO_ITEMS);
  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/Loading your cart/i);
  await settle(page);
  await expect(page).toHaveScreenshot("cart-two-items.png", { fullPage: true });
});
