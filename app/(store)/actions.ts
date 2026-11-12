"use server";

import { PRODUCTS } from "@/lib/data/catalog";
import { deliveryFor } from "@/lib/delivery";
import { variantPrice } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import type { CartLine } from "@/lib/types";
import { customRequestMessage, orderMessage, waLink } from "@/lib/whatsapp";

/**
 * Storefront server actions.
 *
 * PHASE 1 (now): validate input, recompute prices on the server, build the WhatsApp message.
 * PHASE 2 (coding agent): persist to the database inside each action (see docs/phase-2/03-backend-plan.md):
 *   placeOrder        → insert Order + OrderLines + upsert Customer by phone, status "New" (shown as "Pending WhatsApp")
 *   submitCustomRequest → insert CustomRequest (+ upload reference images)
 *   sendContactMessage  → insert ContactMessage (+ optional email notification)
 * The client contract (inputs and return shapes) must stay the same.
 */

const PHONE = /^(\+?92|0)3\d{2}[\s-]?\d{7}$/;
const clean = (s: unknown, max = 500) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export type PlaceOrderInput = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  lines: Pick<CartLine, "productId" | "qty" | "size" | "colour" | "personalisation">[];
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; waUrl: string; message: string; total: number; delivery: number; lines: { name: string; qty: number; total: number }[] }
  | { ok: false; errors: Record<string, string> };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const name = clean(input.name, 80);
  const phone = clean(input.phone, 20);
  const city = clean(input.city, 40);
  const address = clean(input.address, 300);
  const notes = clean(input.notes, 500);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!PHONE.test(phone.replace(/\s/g, ""))) errors.phone = "Enter a Pakistani mobile number, e.g. 0300 1234567.";
  if (!city) errors.city = "Please choose your city.";
  if (address.length < 8) errors.address = "Please add your full address.";
  if (!Array.isArray(input.lines) || input.lines.length === 0) errors.lines = "Your cart is empty.";
  if (input.lines?.length > 30) errors.lines = "Too many items in one order.";

  // Server is the source of truth for prices.
  const lines: CartLine[] = [];
  for (const l of input.lines ?? []) {
    const p = PRODUCTS.find((x) => x.id === l.productId && x.status === "live");
    if (!p) {
      errors.lines = "One of the pieces in your cart is no longer available. Please remove it.";
      continue;
    }
    const size = p.sizes?.find((s) => s.name === l.size);
    const colour = p.colours?.find((c) => c.name === l.colour);
    const price = variantPrice(p, size, colour);
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l.qty) || 1)));
    lines.push({
      key: "",
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size: size?.name,
      colour: colour?.name,
      personalisation: {
        names: clean(l.personalisation?.names, 40) || undefined,
        date: clean(l.personalisation?.date, 10) || undefined,
        text: clean(l.personalisation?.text, 30) || undefined,
        textColour: clean(l.personalisation?.textColour, 20) || undefined,
        referenceImage: clean(l.personalisation?.referenceImage, 120) || undefined,
      },
      unitPrice: price.price,
      unitWas: price.was ?? price.price,
      qty,
      tone: p.tone,
    });
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const paid = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const full = lines.reduce((s, l) => s + l.unitWas * l.qty, 0);
  const delivery = deliveryFor(city)?.charge ?? 400;
  const total = paid + delivery;

  // TODO(phase 2): replace with the database sequence (orders.number) inside a transaction.
  const orderId = `${SITE.orderPrefix}${Math.floor(1047 + Math.random() * 8000)}`;

  const message = orderMessage({
    orderId,
    lines,
    subtotal: paid,
    savings: full - paid,
    delivery,
    total,
    name,
    city,
    address,
    notes: notes || undefined,
  });

  return {
    ok: true,
    orderId,
    message,
    waUrl: waLink(message),
    total,
    delivery,
    lines: lines.map((l) => ({ name: l.name, qty: l.qty, total: l.unitPrice * l.qty })),
  };
}

export type CustomRequestInput = {
  name: string;
  phone: string;
  item: string;
  date?: string;
  budget: string;
  description: string;
  colours: string[];
  images: string[];
};

export async function submitCustomRequest(
  input: CustomRequestInput,
): Promise<{ ok: true; waUrl: string } | { ok: false; errors: Record<string, string> }> {
  const data = {
    name: clean(input.name, 80),
    phone: clean(input.phone, 20),
    item: clean(input.item, 60),
    date: clean(input.date, 10) || undefined,
    budget: clean(input.budget, 40),
    description: clean(input.description, 1200),
    colours: (input.colours ?? []).slice(0, 8).map((c) => clean(c, 20)),
    images: (input.images ?? []).slice(0, 3).map((c) => clean(c, 120)),
  };
  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = "Please enter your name.";
  if (!PHONE.test(data.phone.replace(/\s/g, ""))) errors.phone = "Enter a Pakistani mobile number, e.g. 0300 1234567.";
  if (data.description.length < 10) errors.description = "Tell Ash a little more about your idea.";
  if (Object.keys(errors).length) return { ok: false, errors };

  // TODO(phase 2): insert CustomRequest (status "New") and upload images to storage.
  return { ok: true, waUrl: waLink(customRequestMessage(data)) };
}

export async function sendContactMessage(input: {
  name: string;
  contact: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const name = clean(input.name, 80);
  const contact = clean(input.contact, 120);
  const message = clean(input.message, 2000);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (contact.length < 5) errors.contact = "Add a WhatsApp number or email so Ash can reply.";
  if (message.length < 5) errors.message = "Please write a short message.";
  if (Object.keys(errors).length) return { ok: false, errors };
  // TODO(phase 2): insert ContactMessage and notify Ash (email or WhatsApp Business API).
  return { ok: true };
}
