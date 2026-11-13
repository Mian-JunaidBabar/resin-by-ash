import { expect, test } from "@playwright/test";
import { CART_TWO_ITEMS, LAST_ORDER, settle } from "../helpers";

/**
 * Phase 0 visual baseline. Captures the finished frontend before the data layer
 * changes, so every later phase can prove the storefront still looks the same.
 */

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
  ["admin-product-edit", "/admin/products/p_001"],
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
