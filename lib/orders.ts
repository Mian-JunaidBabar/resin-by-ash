import { rs } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";
import type { Personalisation } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<string, OrderStatus> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_VALUES: Record<OrderStatus, "NEW" | "CONFIRMED" | "IN_PROGRESS" | "SHIPPED" | "DELIVERED" | "CANCELLED"> = {
  New: "NEW",
  Confirmed: "CONFIRMED",
  "In progress": "IN_PROGRESS",
  Shipped: "SHIPPED",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
};

/** Active statuses that count toward sales figures. */
export const SOLD_STATUSES = ["CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED"] as const;

export const ORDER_LABEL = (prefix: string, number: number) => `${prefix}${number}`;

/**
 * Normalises a Pakistani mobile number to 03XXXXXXXXX.
 * Accepts +92 300 1234567, 0092..., 0300-1234567 and 3001234567.
 */
export function normalisePhone(input: string): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92") && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return /^03\d{9}$/.test(digits) ? digits : null;
  if (digits.length === 10 && digits.startsWith("3")) return /^3\d{9}$/.test(digits) ? `0${digits}` : null;
  return null;
}

/**
 * Renders the admin-editable WhatsApp order template. Unknown placeholders are
 * left in place by design; the settings screen validates them on save.
 */
export function renderOrderMessage(
  template: string,
  values: Record<string, string>,
): string {
  const rendered = template.replace(/\{([a-z_]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
  return rendered.length > 1500 ? `${rendered.slice(0, 1489).trimEnd()}…` : rendered;
}

export function optionsLabel(size?: string | null, colour?: string | null) {
  return [size, colour].filter(Boolean).join(" · ");
}

export function personalisationText(p: Personalisation): string {
  const parts: string[] = [];
  if (p.names) parts.push(`Names: ${p.names}`);
  if (p.date) parts.push(`Date: ${p.date}`);
  if (p.text) parts.push(`Text: "${p.text}"`);
  if (p.textColour) parts.push(`Text colour: ${p.textColour}`);
  if (p.referenceImage) parts.push(`Reference image: ${p.referenceImage}`);
  return parts.join(" · ");
}

export function itemsWithPersonalisation(
  lines: {
    name: string;
    size?: string | null;
    colour?: string | null;
    personalisation: Personalisation;
    qty: number;
    unitPrice: number;
  }[],
) {
  return lines
    .map((line) => {
      const opts = optionsLabel(line.size, line.colour);
      const per = personalisationText(line.personalisation);
      return [
        `${line.qty} x ${line.name}${opts ? ` (${opts})` : ""} - ${rs(line.unitPrice * line.qty)}`,
        per ? `   ${per}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
}

/** Display date used in the admin: "12 Nov 2026, 9:14 pm". */
export function adminDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Karachi",
  });
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" });
}
