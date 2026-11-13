import { z } from "zod";

/** Shared validation for the admin catalogue (also unit-tested). */
export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  shortName: z.string().trim().min(1).max(40),
  slug: z.string().trim().max(80).optional(),
  parentId: z.string().trim().optional(),
  h1: z.string().trim().max(120).optional(),
  intro: z.string().trim().max(1000),
  metaTitle: z.string().trim().max(80),
  metaDescription: z.string().trim().max(200),
  seoContent: z.string().max(8000),
  imageUrl: z.string().trim().max(500).optional(),
  ogImageUrl: z.string().trim().max(500).optional(),
  tone: z.string().trim().max(40),
  status: z.enum(["LIVE", "HIDDEN"]),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  showOnHome: z.boolean(),
  showInFooter: z.boolean(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  categoryId: z.string().min(1),
  description: z.string().trim().max(2000),
  details: z.string().max(4000),
  care: z.string().max(2000),
  price: z.coerce.number().int().positive(),
  salePrice: z.coerce.number().int().positive().optional(),
  saleEndsAt: z.string().trim().optional(),
  status: z.enum(["LIVE", "DRAFT", "HIDDEN"]),
  leadTime: z.string().trim().max(80),
  toneBg: z.string().trim().max(40),
  toneAccent: z.string().trim().max(40),
  pinOrder: z.coerce.number().int().min(0).optional(),
});

export type SaleError = "sale" | "sale-date";

/** The sale must be below the regular price and end today or later. */
export function saleValidation(price: number, salePrice?: number | null, saleEndsAt?: string, today = new Date()): SaleError | null {
  if (salePrice == null) return null;
  if (salePrice >= price) return "sale";
  if (!saleEndsAt) return "sale-date";
  const end = new Date(`${saleEndsAt}T23:59:59+05:00`);
  if (Number.isNaN(end.getTime()) || end < today) return "sale-date";
  return null;
}

/** /shop/{parent}/{child} or /shop/{slug} */
export function categoryPath(slug: string, parentSlug?: string | null) {
  return parentSlug ? `/shop/${parentSlug}/${slug}` : `/shop/${slug}`;
}
