import { SITE } from "@/lib/site";
import { rs } from "@/lib/pricing";
import type { CartLine, Personalisation } from "@/lib/types";

/** wa.me link with an optional prefilled message. */
export function waLink(text?: string, phone: string = SITE.whatsapp) {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function personalisationSummary(p: Personalisation) {
  const parts: string[] = [];
  if (p.names) parts.push(`Names: ${p.names}`);
  if (p.date) parts.push(`Date: ${formatDate(p.date)}`);
  if (p.text) parts.push(`Text: "${p.text}"`);
  if (p.textColour) parts.push(`Text colour: ${p.textColour}`);
  if (p.referenceImage) parts.push("Reference image attached (sending in chat)");
  return parts.join(" · ");
}

export function lineOptions(l: Pick<CartLine, "size" | "colour">) {
  return [l.size, l.colour].filter(Boolean).join(" · ");
}

export function formatDate(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Order message, following the template in Admin → Settings → "WhatsApp order message".
 * Kept under ~1,500 characters; product links are left out on purpose.
 */
export function orderMessage(input: {
  orderId: string;
  lines: CartLine[];
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
  name: string;
  city: string;
  address: string;
  notes?: string;
}) {
  const items = input.lines
    .map((l) => {
      const opts = lineOptions(l);
      const per = personalisationSummary(l.personalisation);
      return [
        `${l.qty} x ${l.name}${opts ? ` (${opts})` : ""} - ${rs(l.unitPrice * l.qty)}`,
        per ? `   ${per}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const msg = [
    `Assalam o Alaikum Ash! New order from the website`,
    ``,
    `Order: ${input.orderId}`,
    items,
    ``,
    `Subtotal: ${rs(input.subtotal + input.savings)}`,
    input.savings > 0 ? `You save: ${rs(input.savings)}` : null,
    `Delivery: ${rs(input.delivery)}`,
    `Total: ${rs(input.total)} (Cash on Delivery)`,
    ``,
    `Name: ${input.name}`,
    `City: ${input.city}`,
    `Address: ${input.address}`,
    input.notes ? `Notes: ${input.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return msg.length > 1500 ? msg.slice(0, 1490) + "…" : msg;
}

export function customRequestMessage(input: {
  name: string;
  phone: string;
  item: string;
  date?: string;
  budget: string;
  description: string;
  colours: string[];
  images: string[];
}) {
  return [
    `Assalam o Alaikum Ash! I'd like a custom piece.`,
    ``,
    `Name: ${input.name}`,
    `WhatsApp: ${input.phone}`,
    `What: ${input.item}`,
    input.date ? `Occasion date: ${formatDate(input.date)}` : "",
    `Budget: ${input.budget}`,
    input.colours.length ? `Colours: ${input.colours.join(", ")}` : "",
    ``,
    input.description,
    input.images.length ? `\nReference images: ${input.images.join(", ")} (attaching here)` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
