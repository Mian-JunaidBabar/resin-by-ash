import { describe, expect, it } from "vitest";
import {
  ORDER_TEMPLATE_PLACEHOLDERS,
  templatePlaceholders,
  validateOrderTemplate,
} from "@/lib/settings-validation";

describe("order message template", () => {
  it("accepts every supported placeholder", () => {
    const template = ORDER_TEMPLATE_PLACEHOLDERS.map((p) => `{${p}}`).join("\n");
    expect(validateOrderTemplate(template)).toEqual({ ok: true });
    expect(templatePlaceholders(template)).toEqual([...ORDER_TEMPLATE_PLACEHOLDERS]);
  });

  it("rejects an unknown placeholder", () => {
    const result = validateOrderTemplate("Hi {name}, order {order_id} for {customer_phone}");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("{customer_phone}");
  });

  it("rejects an empty or oversized template", () => {
    expect(validateOrderTemplate("   ").ok).toBe(false);
    expect(validateOrderTemplate("x".repeat(1501)).ok).toBe(false);
  });
});
