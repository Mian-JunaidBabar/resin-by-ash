"use client";

/**
 * Small GA4 event helper. Events only leave the browser after the visitor has
 * accepted analytics cookies, and only when a measurement ID is configured.
 */
export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA_ID) return;
  try {
    if (window.localStorage.getItem("rba-cookie-consent") !== "granted") return;
  } catch {
    return;
  }
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event, ...params });
  w.gtag?.("event", event, params);
}

export function trackItem(product: { id: string; name: string; categoryPath?: { name: string }[] }, price: number, quantity = 1) {
  track("view_item", {
    currency: "PKR",
    value: price * quantity,
    item_id: product.id,
    item_name: product.name,
    item_category: product.categoryPath?.at(-1)?.name ?? "",
  });
}

export function trackAddToCart(product: { id: string; name: string }, price: number, quantity: number) {
  track("add_to_cart", {
    currency: "PKR",
    value: price * quantity,
    item_id: product.id,
    item_name: product.name,
    quantity,
  });
}
