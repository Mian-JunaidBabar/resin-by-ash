import type { Page } from "@playwright/test";

/** Wait for fonts, lazy images and scroll-driven reveals to reach the end state. */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 20_000))]);
    for (const face of document.fonts) {
      if (face.status !== "loaded") await face.load().catch(() => {});
    }
    await document.fonts.ready;
  });
  // Scroll through the page so lazy images load and scroll-driven reveals finish.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(150);
}

export const CART_TWO_ITEMS = [
  {
    key: "p_001||||{}",
    productId: "p_001",
    slug: "gold-leaf-nikkah-tray-pen-set",
    name: "Gold-leaf Nikkah Tray & Pen Set",
    colour: "Ivory marble",
    personalisation: { names: "Ayesha & Hamza", date: "2026-12-20" },
    unitPrice: 6800,
    unitWas: 6800,
    qty: 1,
    tone: ["#F1EBE4", "#D9BD7E"],
  },
  {
    key: "p_005||Blush rose|{}",
    productId: "p_005",
    slug: "pressed-rose-earrings",
    name: "Pressed Rose Earrings",
    size: "Petite",
    colour: "Blush rose",
    personalisation: {},
    unitPrice: 1200,
    unitWas: 1500,
    qty: 2,
    tone: ["#F1EBE4", "#E9B8BE"],
  },
];

export const LAST_ORDER = {
  id: "RBA-1047",
  name: "Ayesha",
  lines: [
    { name: "Gold-leaf Nikkah Tray & Pen Set", qty: 1, total: 6800 },
    { name: "Pressed Rose Earrings", qty: 2, total: 2400 },
  ],
  delivery: 250,
  total: 9450,
  waUrl: "https://wa.me/923001234567",
  message: "Assalam o Alaikum Ash! New order from the website",
};
