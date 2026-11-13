/**
 * Validates the WhatsApp order message template saved in Admin → Settings.
 * Only the placeholders the order renderer understands are allowed, so a typo
 * cannot silently reach customers.
 */
export const ORDER_TEMPLATE_PLACEHOLDERS = [
  "order_id",
  "items_with_personalisation",
  "total",
  "name",
  "city",
  "address",
] as const;

export function templatePlaceholders(template: string): string[] {
  return [...template.matchAll(/\{([a-z_]+)\}/gi)].map((m) => m[1].toLowerCase());
}

export function validateOrderTemplate(template: string): { ok: true } | { ok: false; error: string } {
  if (!template.trim()) return { ok: false, error: "The order message cannot be empty." };
  if (template.length > 1500) return { ok: false, error: "Keep the order message under 1,500 characters." };
  const unknown = [...new Set(templatePlaceholders(template))].filter(
    (p) => !(ORDER_TEMPLATE_PLACEHOLDERS as readonly string[]).includes(p),
  );
  if (unknown.length) {
    return { ok: false, error: `Unknown placeholder${unknown.length > 1 ? "s" : ""}: ${unknown.map((p) => `{${p}}`).join(", ")}` };
  }
  return { ok: true };
}
