import { expect, test, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", quiet: true });

const db = new Pool({ connectionString: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL });
const EMAIL = process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "studio-pass-2026";

test.describe.configure({ mode: "serial" });

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Admin auth is viewport-independent");
});

test.afterAll(async () => {
  await db.end();
});

async function login(page: Page, email = EMAIL, password = PASSWORD) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("every admin route redirects a signed-out visitor to login with next", async ({ page }) => {
  for (const path of ["/admin", "/admin/orders", "/admin/products/new", "/admin/home", "/admin/settings/users"]) {
    await page.goto(path);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/admin/login");
    expect(url.searchParams.get("next")).toBe(path);
  }
});

test("a successful login lands on the page that was requested", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
  // The Suspense fallback starts with next=/admin; wait for the streamed param.
  await expect(page.locator('input[name="next"][value="/admin/orders"]')).toHaveCount(1);
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
});

test("the session cookie is httpOnly, lax and seven days long", async ({ page, context }) => {
  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
  const cookie = (await context.cookies()).find((c) => c.name === "rba_session");
  expect(cookie).toBeTruthy();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.path).toBe("/");
  const days = ((cookie?.expires ?? 0) * 1000 - Date.now()) / 86_400_000;
  expect(days).toBeGreaterThan(6.8);
});

test("five failed logins block even the right password until the window passes", async ({ page }) => {
  try {
    for (let i = 0; i < 5; i += 1) {
      await login(page, EMAIL, "definitely-wrong");
      await expect(page).toHaveURL(/error=credentials/);
    }
    await login(page, EMAIL, PASSWORD);
    await expect(page).toHaveURL(/error=throttled/);
    await expect(page.getByRole("alert").filter({ hasText: "Too many attempts" })).toBeVisible();
  } finally {
    await db.query(`DELETE FROM "LoginAttempt"`);
  }
});

test("a server action POST without a session is rejected and changes nothing", async ({ page, request, context }) => {
  const before = (await db.query(`SELECT "heroHeadline" FROM "HomeContent" WHERE id = 1`)).rows[0].heroHeadline;
  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/home");
  await page.locator("#home-form").waitFor();
  const html = await page.content();
  const action = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  expect(action, "the home form should expose its server action id").toBeTruthy();

  // A fresh request context has no session cookie.
  await context.clearCookies();
  const response = await request.post("/admin/home", {
    form: { [action!]: "", heroHeadline: "Hacked headline" },
    maxRedirects: 0,
  });
  expect([302, 303, 307]).toContain(response.status());
  expect(response.headers()["location"] ?? "").toContain("/admin/login");

  const after = (await db.query(`SELECT "heroHeadline" FROM "HomeContent" WHERE id = 1`)).rows[0].heroHeadline;
  expect(after).toBe(before);
});

test("sign out clears the session", async ({ page, context }) => {
  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await context.cookies()).some((c) => c.name === "rba_session")).toBe(false);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
});

test("an invite link works once, then expires", async ({ page, browser }) => {
  const inviteEmail = "dev-e2e@example.com";
  const password = "developer-pass-2026";
  try {
    await login(page);
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/settings/users");
    await page.fill('input[name="email"]', inviteEmail);
    await page.selectOption('select[name="role"]', "DEVELOPER");
    await page.getByRole("button", { name: "Create invite link" }).click();
    await expect(page).toHaveURL(/invite=/);
    const link = await page.locator('input[readonly]').inputValue();
    expect(link).toContain("/admin/invite/");

    const anon = await browser.newContext();
    const invitePage = await anon.newPage();
    await invitePage.goto(link);
    await invitePage.fill('input[name="name"]', "E2E Developer");
    await invitePage.fill('input[name="password"]', password);
    await invitePage.fill('input[name="confirm"]', password);
    await invitePage.getByRole("button", { name: "Set password and continue" }).click();
    await expect(invitePage).toHaveURL(/\/admin\/login\?ready=1/);

    await invitePage.fill('input[name="email"]', inviteEmail);
    await invitePage.fill('input[name="password"]', password);
    await invitePage.getByRole("button", { name: "Sign in" }).click();
    await expect(invitePage).toHaveURL(/\/admin$/);

    await invitePage.goto(link);
    await expect(invitePage.getByText(/expired or has already been used/i)).toBeVisible();
    await anon.close();
  } finally {
    await db.query(`DELETE FROM "Invite" WHERE email = $1`, [inviteEmail]);
    const user = await db.query<{ id: string }>(`SELECT id FROM "AdminUser" WHERE email = $1`, [inviteEmail]);
    if (user.rows[0]) {
      await db.query(`DELETE FROM "Session" WHERE "userId" = $1`, [user.rows[0].id]);
      await db.query(`DELETE FROM "AdminUser" WHERE id = $1`, [user.rows[0].id]);
    }
  }
});

test("an expired invite cannot be used", async ({ browser }) => {
  const token = randomBytes(16).toString("hex");
  await db.query(
    `INSERT INTO "Invite" (id, email, role, token, "expiresAt", "createdAt") VALUES ($1, 'expired@example.com', 'DEVELOPER', $2, now() - interval '1 day', now())`,
    [token, token],
  );
  try {
    const anon = await browser.newContext();
    const page = await anon.newPage();
    await page.goto(`/admin/invite/${token}`);
    await expect(page.getByText(/expired or has already been used/i)).toBeVisible();
    await anon.close();
  } finally {
    await db.query(`DELETE FROM "Invite" WHERE token = $1`, [token]);
  }
});
