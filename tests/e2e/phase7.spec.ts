import { expect, test, type Page } from "@playwright/test";
import dotenv from "dotenv";
import { Pool } from "pg";
import { CART_TWO_ITEMS, settle } from "../helpers";

dotenv.config({ path: ".env.local", quiet: true });

const db = new Pool({ connectionString: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL });
const EMAIL = process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "studio-pass-2026";
const PHONE = "03007770001";

test.describe.configure({ mode: "serial" });
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name === "mobile", "Phase 7 flow is checked once on desktop"));

let requestId = 0;
let settingsBefore: Record<string, unknown>;
let lahoreCharge = 0;

test.beforeAll(async () => {
  const [settings, lahore] = await Promise.all([
    db.query('SELECT "whatsappNumber", "whatsappDisplay", "announcementOn", announcement FROM "Settings" WHERE id = 1'),
    db.query('SELECT charge FROM "DeliveryZone" WHERE label = $1', ["Lahore"]),
  ]);
  settingsBefore = settings.rows[0];
  lahoreCharge = lahore.rows[0]?.charge ?? 0;

  await cleanup();
});

test.afterAll(async () => {
  await cleanup();
  if (settingsBefore) {
    await db.query(
      'UPDATE "Settings" SET "whatsappNumber" = $1, "whatsappDisplay" = $2, "announcementOn" = $3, announcement = $4 WHERE id = 1',
      [settingsBefore.whatsappNumber, settingsBefore.whatsappDisplay, settingsBefore.announcementOn, settingsBefore.announcement],
    );
  }
  if (lahoreCharge) {
    await db.query('UPDATE "DeliveryZone" SET charge = $1 WHERE label = $2', [lahoreCharge, "Lahore"]);
  }
  // Restoring rows directly bypasses the server actions, so clear the cached
  // settings before later specs (especially the visual baselines) read them.
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3100"}/api/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.AUTH_SECRET ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tags: ["settings", "delivery"],
      paths: ["/", "/shop", "/shop/jewellery", "/product/pressed-rose-earrings", "/custom", "/cart", "/thank-you", "/about", "/faq", "/contact"],
    }),
  }).catch(() => {});
  await db.end();
});

async function cleanup() {
  await db.query('DELETE FROM "CustomRequest" WHERE phone = $1', [PHONE]);
  await db.query('DELETE FROM "ContactMessage" WHERE contact = $1', [PHONE]);
  await db.query('DELETE FROM "Order" WHERE phone = $1', [PHONE]);
  await db.query('DELETE FROM "Customer" WHERE phone = $1', [PHONE]);
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function stubWhatsApp(page: Page) {
  await page.addInitScript(() => {
    const store = (value: string) => {
      (window as unknown as { __waUrl: string | null }).__waUrl = value;
      try {
        sessionStorage.setItem("__waUrl", value);
      } catch {}
    };
    (window as unknown as { __waUrl: string | null }).__waUrl = null;
    window.open = (url?: string | URL) => {
      if (url) store(String(url));
      const tab = {
        close() {},
        location: {
          set href(value: string) {
            store(value);
          },
        },
      };
      return tab as unknown as Window;
    };
  });
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("a custom request with two photos can be quoted and converted into a linked order", async ({ page }) => {
  await stubWhatsApp(page);
  await page.goto("/custom");
  await settle(page);

  const form = page.locator("form#custom-form");
  await form.locator('input[name="name"]').fill("Request Tester");
  await form.locator('input[name="phone"]').fill(PHONE);
  await form.locator('textarea[name="description"]').fill("Two reference photos for a round nikkah tray with gold flakes.");
  const files = form.locator('input[type="file"]');
  await files.nth(0).setInputFiles({ name: "one.png", mimeType: "image/png", buffer: PNG });
  await expect(form.getByText("Photo attached")).toHaveCount(1);
  await files.nth(1).setInputFiles({ name: "two.png", mimeType: "image/png", buffer: PNG });
  await expect(form.getByText("Photo attached")).toHaveCount(2);
  await form.getByRole("button", { name: "Send on WhatsApp" }).click();
  await expect(page.getByRole("heading", { name: "Sent to Ash." })).toBeVisible();
  const wa = await page.evaluate(() => sessionStorage.getItem("__waUrl"));
  expect(decodeURIComponent(wa ?? "")).toContain("Reference images:");

  const saved = await db.query(
    'SELECT id, status, "imageUrls", "occasionDate" FROM "CustomRequest" WHERE phone = $1 ORDER BY id DESC LIMIT 1',
    [PHONE],
  );
  expect(saved.rowCount).toBe(1);
  requestId = saved.rows[0].id;
  expect(saved.rows[0].status).toBe("NEW");
  expect(saved.rows[0].imageUrls).toHaveLength(2);
  expect(saved.rows[0].imageUrls[0]).toMatch(/^\/uploads\//);

  await login(page);
  await page.goto("/admin/requests");
  await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible();
  await expect(page.getByText("Request Tester")).toBeVisible();
  await page.goto(`/admin/requests/${requestId}`);
  await expect(page.getByRole("img", { name: `Reference for request #${requestId}` })).toHaveCount(2);

  await page.fill('input[name="amount"]', "7500");
  await page.fill('input[name="readyBy"]', "2026-12-20");
  await page.getByRole("button", { name: "Send quote" }).click();
  await expect(page.getByText("Quote saved. WhatsApp opened in a new tab.")).toBeVisible();
  const quoteWa = await page.evaluate(() => sessionStorage.getItem("__waUrl"));
  expect(decodeURIComponent(quoteWa ?? "")).toContain("Rs 7,500");

  const quoted = await db.query('SELECT status, quote, "readyBy" FROM "CustomRequest" WHERE id = $1', [requestId]);
  expect(quoted.rows[0].status).toBe("QUOTED");
  expect(quoted.rows[0].quote).toBe(7500);

  const convert = page.getByRole("button", { name: "Convert to order" });
  await expect(convert).toBeEnabled();
  await convert.click();
  await expect(page).toHaveURL(/\/admin\/orders\/RBA-\d+/);
  const orderLabel = page.url().split("/").pop()!;

  const linked = await db.query('SELECT "orderId", status FROM "CustomRequest" WHERE id = $1', [requestId]);
  expect(linked.rows[0].status).toBe("ACCEPTED");
  expect(linked.rows[0].orderId).toBeTruthy();
  const order = await db.query('SELECT number, total, status FROM "Order" WHERE id = $1', [linked.rows[0].orderId]);
  expect(order.rows[0].status).toBe("NEW");
  expect(order.rows[0].total).toBe(7500);
  expect(`RBA-${order.rows[0].number}`).toBe(orderLabel);

  await page.goto(`/admin/requests/${requestId}`);
  await expect(page.getByRole("link", { name: `Open order ${orderLabel}` })).toBeVisible();
});

test("contact messages are saved and listed under custom requests", async ({ page }) => {
  await page.goto("/contact");
  await settle(page);
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send message" }) });
  await form.locator('input[name="name"]').fill("Contact Tester");
  await form.locator('input[name="contact"]').fill(PHONE);
  await form.locator('textarea[name="message"]').fill("Can you make a set of six name keychains for a bridal shower?");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();

  const saved = await db.query('SELECT id, handled FROM "ContactMessage" WHERE contact = $1', [PHONE]);
  expect(saved.rowCount).toBe(1);
  expect(saved.rows[0].handled).toBe(false);

  await login(page);
  await page.goto("/admin/requests/messages");
  await expect(page.getByText("Contact Tester")).toBeVisible();
  await expect(page.getByText("Can you make a set of six name keychains")).toBeVisible();
  await page.getByRole("button", { name: "Mark answered" }).first().click();
  await expect.poll(async () => (await db.query('SELECT handled FROM "ContactMessage" WHERE id = $1', [saved.rows[0].id])).rows[0].handled).toBe(true);
});

test("customers show order aggregates, editable tags, chat links and CSV export", async ({ page }) => {
  await login(page);
  await page.goto(`/admin/customers?q=${PHONE}`);
  await expect(page.getByText("Request Tester")).toBeVisible();
  const row = page.locator("tbody tr").filter({ hasText: PHONE });
  await expect(row).toContainText("1");
  await expect(row.getByRole("link", { name: "Open chat" })).toHaveAttribute("href", `https://wa.me/92${PHONE.slice(1)}`);

  await row.locator('input[name="tag"]').fill("Nikkah Dec");
  await row.getByRole("button", { name: "Save" }).click();
  await expect
    .poll(async () => (await db.query('SELECT tag FROM "Customer" WHERE phone = $1', [PHONE])).rows[0]?.tag)
    .toBe("Nikkah Dec");

  const csv = await page.request.get(`/admin/customers/export.csv?q=${PHONE}`);
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const body = await csv.text();
  expect(body).toContain("Name,Phone,City,Orders,Total spent,Last order,Tag");
  expect(body).toContain("Request Tester");
  expect(body).toContain(PHONE);
  expect(body).toContain("Nikkah Dec");
});

test("settings drive WhatsApp, delivery charges, the FAQ answer and the announcement bar", async ({ page }) => {
  await login(page);
  await page.goto("/admin/settings");
  await page.fill('input[name="whatsappNumber"]', "923009998887");
  await page.fill('input[name="whatsappDisplay"]', "+92 300 9998887");
  await page.fill('input[name="announcement"]', "Phase 7 announcement marker");
  await page.uncheck('input[name="announcementOn"]');
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/admin\/settings\?saved=1/);

  const lahore = page.locator('form').filter({ has: page.locator('input[name="label"][value="Lahore"]') });
  await lahore.locator('input[name="charge"]').fill("300");
  await lahore.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/settings\?saved=zones/);

  await page.goto("/product/pressed-rose-earrings");
  await expect(page.locator('a[href*="wa.me/923009998887"]').first()).toBeVisible();
  const purchaseWa = await page
    .locator('a[href*="wa.me/923009998887"]')
    .filter({ hasText: "Order on WhatsApp" })
    .first()
    .getAttribute("href");
  expect(purchaseWa).toContain("wa.me/923009998887");

  await page.addInitScript((lines) => localStorage.setItem("rba-cart-v1", JSON.stringify(lines)), CART_TWO_ITEMS);
  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/Loading your cart/i);
  await expect(page.locator('a[href*="wa.me/923009998887"]').first()).toBeVisible();
  await page.selectOption('select[name="city"]', "Lahore");
  await expect(page.getByText("Rs 9,500")).toBeVisible();

  await page.goto("/faq");
  await page.getByText("How much is delivery?").click();
  await expect(page.getByText("Lahore Rs 300 (1–2 days)")).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Phase 7 announcement marker")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Cash on Delivery all over Pakistan");

  // Restore through the admin action (not just SQL) so every cached route is
  // invalidated before the visual baselines run.
  await page.goto("/admin/settings");
  await page.fill('input[name="whatsappNumber"]', String(settingsBefore.whatsappNumber));
  await page.fill('input[name="whatsappDisplay"]', String(settingsBefore.whatsappDisplay));
  await page.fill('input[name="announcement"]', String(settingsBefore.announcement));
  if (settingsBefore.announcementOn) await page.check('input[name="announcementOn"]');
  else await page.uncheck('input[name="announcementOn"]');
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/admin\/settings\?saved=1/);

  const restoreZone = page.locator("form").filter({ has: page.locator('input[name="label"][value="Lahore"]') });
  await restoreZone.locator('input[name="charge"]').fill(String(lahoreCharge));
  await restoreZone.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/settings\?saved=zones/);
});
