import { describe, expect, it } from "vitest";
import { ORDER_LABEL, itemsWithPersonalisation, normalisePhone, renderOrderMessage } from "@/lib/orders";

describe("normalisePhone", () => {
  it.each([
    ["+92 300 1234567", "03001234567"],
    ["0300-1234567", "03001234567"],
    ["3001234567", "03001234567"],
    ["0092 321 7654321", "03217654321"],
    ["0321 765 4321", "03217654321"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalisePhone(input)).toBe(expected);
  });

  it.each(["12345", "04001234567", "", "abc"])("rejects %s", (input) => {
    expect(normalisePhone(input)).toBeNull();
  });
});

describe("order message", () => {
  it("replaces every supported placeholder", () => {
    const template = "Order {order_id}\n{items_with_personalisation}\nTotal: {total}\n{name}, {city}\n{address}";
    const message = renderOrderMessage(template, {
      order_id: "RBA-1047",
      items_with_personalisation: "1 x Tray - Rs 6,800",
      total: "Rs 7,050",
      name: "Ayesha",
      city: "Lahore",
      address: "House 1",
    });
    expect(message).toContain("RBA-1047");
    expect(message).toContain("1 x Tray");
    expect(message).not.toContain("{");
  });

  it("caps the WhatsApp message at 1,500 characters", () => {
    const message = renderOrderMessage("{name}", { name: "x".repeat(4000) });
    expect(message.length).toBeLessThanOrEqual(1500);
    expect(message.endsWith("…")).toBe(true);
  });

  it("includes personalisation and reference image on the item line", () => {
    const text = itemsWithPersonalisation([
      {
        name: "Nikkah Tray",
        size: "Large",
        colour: "Ivory",
        personalisation: { names: "A & H", text: "14.02", referenceImage: "/uploads/ref.png" },
        qty: 2,
        unitPrice: 1000,
      },
    ]);
    expect(text).toContain("2 x Nikkah Tray (Large · Ivory) - Rs 2,000");
    expect(text).toContain("Names: A & H");
    expect(text).toContain("/uploads/ref.png");
  });

  it("formats the display order id", () => {
    expect(ORDER_LABEL("RBA-", 1047)).toBe("RBA-1047");
  });
});
