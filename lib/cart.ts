"use client";

import { useSyncExternalStore } from "react";
import type { CartLine } from "@/lib/types";

/**
 * Tiny cart store in localStorage, shared across tabs.
 * No login needed. Prices here are display copies only: the server recomputes
 * every total from the catalogue when the order is placed (see app/(store)/cart/actions.ts).
 */

const KEY = "rba-cart-v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage full or blocked: cart still works for this page view */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  const lines = useCart();
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function lineKey(l: Omit<CartLine, "key" | "qty">) {
  return [l.productId, l.size ?? "", l.colour ?? "", JSON.stringify(l.personalisation)].join("|");
}

export const cart = {
  add(line: Omit<CartLine, "key">) {
    const key = lineKey(line);
    const lines = read();
    const existing = lines.find((l) => l.key === key);
    write(
      existing
        ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(10, l.qty + line.qty) } : l))
        : [...lines, { ...line, key }],
    );
  },
  setQty(key: string, qty: number) {
    write(read().map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)));
  },
  remove(key: string) {
    write(read().filter((l) => l.key !== key));
  },
  clear() {
    write([]);
  },
};

/** Last placed order, so the Thank-you page can show it after the redirect. */
const LAST = "rba-last-order";
export type LastOrder = {
  id: string;
  name: string;
  lines: { name: string; qty: number; total: number }[];
  delivery: number;
  total: number;
  waUrl: string;
  message: string;
};
export function saveLastOrder(o: LastOrder) {
  try {
    window.sessionStorage.setItem(LAST, JSON.stringify(o));
  } catch {}
}
let lastRaw: string | null = null;
let lastParsed: LastOrder | null = null;
export function readLastOrder(): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST);
    if (raw !== lastRaw) {
      lastRaw = raw;
      lastParsed = raw ? (JSON.parse(raw) as LastOrder) : null;
    }
    return lastParsed;
  } catch {
    return null;
  }
}
export function useLastOrder() {
  return useSyncExternalStore(noopSub, readLastOrder, () => null);
}
const noopSub = () => () => {};

const noop = () => () => {};
/** true after hydration; lets cart UIs avoid flashing the server's empty state. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
