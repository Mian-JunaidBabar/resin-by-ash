import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CART_TWO_ITEMS, LAST_ORDER, settle } from "../helpers";

const STOREFRONT = [
  "/",
  "/shop",
  "/shop/jewellery",
  "/shop/jewellery/earrings",
  "/product/pressed-rose-earrings",
  "/custom",
  "/about",
  "/faq",
  "/contact",
];

async function jsonLd(page: import("@playwright/test").Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  }) as Record<string, unknown>[];
}

const hasType = (items: Record<string, unknown>[], type: string) => items.some((item) => item["@type"] === type);

test("security headers, robots and noindex routes are enforced", async ({ page }) => {
  const home = await page.request.get("/");
  expect(home.status()).toBe(200);
  const headers = home.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-robots-tag"]).toBeUndefined();

  for (const path of ["/admin/login", "/cart", "/thank-you", "/api/orders/999999/public"]) {
    const res = await page.request.get(path);
    expect(res.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
  }

  const robots = await (await page.request.get("/robots.txt")).text();
  for (const path of ["/admin", "/cart", "/thank-you", "/api"]) {
    expect(robots).toContain(`Disallow: ${path}`);
  }
  expect(robots).toContain("/sitemap.xml");
});

test("product Open Graph image is generated as a PNG", async ({ page }) => {
  await page.goto("/product/pressed-rose-earrings");
  const content = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(content).toBeTruthy();
  const imageUrl = new URL(content!, page.url());
  expect(imageUrl.pathname).toContain("/product/pressed-rose-earrings/opengraph-image");
  const res = await page.request.get(imageUrl.toString());
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  const body = await res.body();
  expect(body.length).toBeGreaterThan(5_000);
  expect(body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});

test("structured data exposes the shop, product offer, breadcrumbs, collection and FAQ", async ({ page }) => {
  await page.goto("/");
  let items = await jsonLd(page);
  expect(hasType(items, "Store")).toBe(true);
  expect(hasType(items, "WebSite")).toBe(true);
  const website = items.find((item) => item["@type"] === "WebSite") as Record<string, unknown>;
  expect(JSON.stringify(website.potentialAction)).toContain("SearchAction");

  await page.goto("/product/pressed-rose-earrings");
  items = await jsonLd(page);
  expect(hasType(items, "Product")).toBe(true);
  expect(hasType(items, "BreadcrumbList")).toBe(true);
  expect(hasType(items, "Store")).toBe(true);
  const product = items.find((item) => item["@type"] === "Product") as Record<string, unknown>;
  const offers = product.offers as Record<string, unknown>;
  expect(offers.priceCurrency).toBe("PKR");
  expect(Number(offers.price)).toBe(1200);
  expect(["https://schema.org/PreOrder", "https://schema.org/InStock"]).toContain(offers.availability);
  expect(offers.priceValidUntil).toBeTruthy();

  await page.goto("/shop/jewellery");
  items = await jsonLd(page);
  expect(hasType(items, "CollectionPage")).toBe(true);
  expect(hasType(items, "BreadcrumbList")).toBe(true);
  expect(hasType(items, "ItemList")).toBe(true);

  await page.goto("/shop/jewellery/earrings");
  items = await jsonLd(page);
  expect(hasType(items, "CollectionPage")).toBe(true);
  expect(hasType(items, "BreadcrumbList")).toBe(true);

  await page.goto("/faq");
  items = await jsonLd(page);
  expect(hasType(items, "FAQPage")).toBe(true);
  const faq = items.find((item) => item["@type"] === "FAQPage") as Record<string, unknown>;
  const questions = faq.mainEntity as { acceptedAnswer: { text: string } }[];
  expect(questions.some((q) => q.acceptedAnswer.text.includes("Lahore Rs"))).toBe(true);
});

test("no serious or critical accessibility issues on storefront pages", async ({ page }) => {
  test.slow();
  for (const path of STOREFRONT) {
    await page.goto(path);
    await settle(page);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking, `${path}\n${blocking.map((v) => `${v.id}: ${v.help}`).join("\n")}`).toEqual([]);
  }

  await page.addInitScript((order) => sessionStorage.setItem("rba-last-order", JSON.stringify(order)), LAST_ORDER);
  await page.goto("/thank-you");
  await page.reload();
  await settle(page);
  let result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);

  await page.addInitScript((lines) => localStorage.setItem("rba-cart-v1", JSON.stringify(lines)), CART_TWO_ITEMS);
  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/Loading your cart/i);
  await settle(page);
  result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});

test("reduced motion keeps all content visible and pages are console clean", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const path of ["/", "/shop/jewellery/earrings", "/product/pressed-rose-earrings", "/cart"]) {
    await page.goto(path);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  expect(errors).toEqual([]);
});
