"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getDeliveryZones, getSettings } from "@/lib/queries";
import { priceInfo, rs } from "@/lib/pricing";
import type { CartLine, Personalisation } from "@/lib/types";
import { customRequestMessage, waLink } from "@/lib/whatsapp";
import { storeMedia } from "@/lib/uploads";
import {
  ORDER_LABEL,
  itemsWithPersonalisation,
  normalisePhone,
  renderOrderMessage,
} from "@/lib/orders";

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

const clean = (s: unknown, max = 500) => (typeof s === "string" ? s.trim().slice(0, max) : "");
const SAFE_MEDIA = /^(\/uploads\/[\w.-]+|https:\/\/[^\s]+)$/;

/** In-memory IP limiter. Resets with the server process; phone limits are DB-backed. */
const ipHits = new Map<string, { count: number; resetAt: number }>();
function ipAllowed(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hit = ipHits.get(ip);
  if (!hit || hit.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  hit.count += 1;
  return hit.count <= limit;
}

function karachiDay(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(d);
}

function saleActive(saleEndsAt: Date | null) {
  return !saleEndsAt || karachiDay(saleEndsAt) >= karachiDay();
}

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
  const phoneInput = clean(input.phone, 20);
  const city = clean(input.city, 40);
  const address = clean(input.address, 300);
  const notes = clean(input.notes, 500);
  const phone = normalisePhone(phoneInput);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!phone) errors.phone = "Enter a Pakistani mobile number, e.g. 0300 1234567.";
  if (!city) errors.city = "Please choose your city.";
  if (address.length < 8) errors.address = "Please add your full address.";
  if (!Array.isArray(input.lines) || input.lines.length === 0) errors.lines = "Your cart is empty.";
  if (input.lines?.length > 30) errors.lines = "Too many items in one order.";
  if (Object.keys(errors).length || !phone) return { ok: false, errors };

  const [settings, zones] = await Promise.all([getSettings(), getDeliveryZones()]);

  // Rate limits: 5 orders per phone per hour, 20 per IP per hour.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existingCustomer = await db.customer.findUnique({ where: { phone } });
  if (existingCustomer) {
    const recent = await db.order.count({ where: { customerId: existingCustomer.id, createdAt: { gte: hourAgo } } });
    if (recent >= 5) {
      return { ok: false, errors: { phone: "Too many orders from this number. Please message Ash on WhatsApp." } };
    }
  }
  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || "local";
  if (!ipAllowed(ip, 20, 60 * 60 * 1000)) {
    return { ok: false, errors: { lines: "Too many orders from this connection. Please try again in an hour." } };
  }

  // Server is the source of truth for prices.
  const ids = [...new Set((input.lines ?? []).map((l) => clean(l.productId, 60)).filter(Boolean))];
  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "LIVE" },
    include: { variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: CartLine[] = [];
  for (const l of input.lines ?? []) {
    const p = byId.get(clean(l.productId, 60));
    if (!p) {
      errors.lines = "One of the pieces in your cart is no longer available. Please remove it.";
      continue;
    }
    const size = p.variants.find((v) => v.kind === "size" && v.name === l.size);
    const colour = p.variants.find((v) => v.kind === "colour" && v.name === l.colour);
    const delta = (size?.priceDelta ?? 0) + (colour?.priceDelta ?? 0);
    const price = priceInfo(p.price + delta, saleActive(p.saleEndsAt) && p.salePrice != null ? p.salePrice + delta : undefined);
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l.qty) || 1)));
    const reference = clean(l.personalisation?.referenceImage, 500);
    const personalisation: Personalisation = {
      names: clean(l.personalisation?.names, 40) || undefined,
      date: clean(l.personalisation?.date, 10) || undefined,
      text: clean(l.personalisation?.text, 30) || undefined,
      textColour: clean(l.personalisation?.textColour, 20) || undefined,
      referenceImage: SAFE_MEDIA.test(reference) ? reference : undefined,
    };
    lines.push({
      key: "",
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size: size?.name,
      colour: colour?.name,
      personalisation,
      unitPrice: price.price,
      unitWas: price.was ?? price.price,
      qty,
      tone: [p.toneBg, p.toneAccent],
    });
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const paid = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const full = lines.reduce((s, l) => s + l.unitWas * l.qty, 0);
  const zone = zones.find((z) => z.cities.includes(city)) ?? zones[zones.length - 1];
  const delivery = zone?.charge ?? 400;
  const total = paid + delivery;

  const saved = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone },
      update: { name, city, address },
      create: { name, phone, city, address },
    });
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        name,
        phone,
        city,
        address,
        notes: notes || null,
        subtotal: paid,
        savings: full - paid,
        delivery,
        total,
        whatsappMessage: "",
        status: "NEW",
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            size: l.size,
            colour: l.colour,
            personalisation: l.personalisation as object,
            qty: l.qty,
            unitPrice: l.unitPrice,
            unitWas: l.unitWas,
          })),
        },
        events: { create: { label: "Order placed on site" } },
      },
    });
    const orderId = ORDER_LABEL(settings.orderPrefix, order.number);
    const message = renderOrderMessage(settings.orderMessageTemplate, {
      order_id: orderId,
      items_with_personalisation: itemsWithPersonalisation(lines),
      total: rs(total),
      name,
      city,
      address,
    });
    await tx.order.update({ where: { id: order.id }, data: { whatsappMessage: message } });
    return { order, orderId, message };
  });

  return {
    ok: true,
    orderId: saved.orderId,
    message: saved.message,
    waUrl: waLink(saved.message, settings.whatsappNumber),
    total,
    delivery,
    lines: lines.map((l) => ({ name: l.name, qty: l.qty, total: l.unitPrice * l.qty })),
  };
}

/** Uploads a customer reference photo and returns its stored URL. */
export async function uploadReferenceImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choose a photo first." };
  try {
    const stored = await storeMedia(file);
    if (stored.isVideo) return { ok: false, error: "Please upload a photo." };
    return { ok: true, url: stored.url };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
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
    images: (input.images ?? []).slice(0, 3).map((c) => clean(c, 500)),
  };
  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = "Please enter your name.";
  if (!normalisePhone(data.phone)) errors.phone = "Enter a Pakistani mobile number, e.g. 0300 1234567.";
  if (data.description.length < 10) errors.description = "Tell Ash a little more about your idea.";
  if (Object.keys(errors).length) return { ok: false, errors };

  // TODO(phase 7): persist CustomRequest and uploaded references.
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
  // TODO(phase 7): insert ContactMessage and notify Ash (email or WhatsApp Business API).
  return { ok: true };
}
