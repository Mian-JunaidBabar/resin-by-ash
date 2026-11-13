import { describe, expect, it } from "vitest";
import { categoryPath, categorySchema, productSchema, saleValidation } from "@/lib/catalogue-validation";
import { slugify } from "@/lib/slug";

const category = {
  name: "Gift Boxes",
  shortName: "Gift boxes",
  intro: "Boxed sets",
  metaTitle: "Gift Boxes · Handmade resin in Pakistan",
  metaDescription: "Handmade resin gift boxes.",
  seoContent: "## Gift boxes",
  tone: "#F1EBE4",
  status: "LIVE",
  sortOrder: 0,
  showOnHome: false,
  showInFooter: true,
};

const product = {
  name: "Gift Box",
  categoryId: "cat_1",
  description: "A box",
  details: "",
  care: "",
  price: 1500,
  status: "LIVE",
  leadTime: "5 days",
  toneBg: "#F1EBE4",
  toneAccent: "#E9B8BE",
};

describe("catalogue validation", () => {
  it("accepts a valid category and rejects a missing name", () => {
    expect(categorySchema.safeParse(category).success).toBe(true);
    expect(categorySchema.safeParse({ ...category, name: "" }).success).toBe(false);
  });

  it("validates product price and name length", () => {
    expect(productSchema.safeParse(product).success).toBe(true);
    expect(productSchema.safeParse({ ...product, name: "x" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, price: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, categoryId: "" }).success).toBe(false);
  });

  it("blocks a sale price that is not lower than the regular price", () => {
    expect(saleValidation(1500, 1200, "2027-01-01")).toBeNull();
    expect(saleValidation(1500, 1600, "2027-01-01")).toBe("sale");
    expect(saleValidation(1500, 1500, "2027-01-01")).toBe("sale");
  });

  it("requires a sale end date today or later", () => {
    expect(saleValidation(1500, 1200, "")).toBe("sale-date");
    expect(saleValidation(1500, 1200, "2020-01-01")).toBe("sale-date");
    expect(saleValidation(1500, undefined)).toBeNull();
  });

  it("creates category paths and redirects when a slug changes", () => {
    expect(categoryPath("gift-boxes")).toBe("/shop/gift-boxes");
    expect(categoryPath("eid-boxes", "gift-boxes")).toBe("/shop/gift-boxes/eid-boxes");
    expect(categoryPath("gift-sets", null)).not.toBe(categoryPath("gift-boxes"));
  });

  it("slugifies labels", () => {
    expect(slugify("Gift Boxes & Sets")).toBe("gift-boxes-and-sets");
    expect(slugify("  Eid   Boxes ")).toBe("eid-boxes");
    expect(slugify("Wall clocks")).toBe("wall-clocks");
  });
});
