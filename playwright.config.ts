import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;
const testDatabaseUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

/**
 * Mobile + desktop projects. The web server always builds and boots against the
 * separate test database, never the development one.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One worker: E2E state changes share the test database and cache.
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-GB",
    timezoneId: "Asia/Karachi",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: `rm -rf .next && npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATABASE_URL: testDatabaseUrl ?? "",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567",
      NEXT_PUBLIC_WHATSAPP_DISPLAY: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "+92 300 1234567",
    },
  },
});
