import type { MetadataRoute } from "next";
import { CATEGORIES, PRODUCTS } from "@/lib/data/catalog";
import { absoluteUrl } from "@/lib/site";

// Phase 2: read products/categories from the database via lib/queries.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/shop", "/custom", "/about", "/faq", "/contact"].map((p) => ({
    url: absoluteUrl(p),
    changeFrequency: p === "/" || p === "/shop" ? ("daily" as const) : ("monthly" as const),
    priority: p === "/" ? 1 : p === "/shop" ? 0.9 : 0.6,
  }));
  const cats = CATEGORIES.map((c) => ({
    url: absoluteUrl(`/shop/${c.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const products = PRODUCTS.filter((p) => p.status === "live").map((p) => ({
    url: absoluteUrl(`/product/${p.slug}`),
    lastModified: p.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    images: p.images.map((i) => absoluteUrl(i)),
  }));
  return [...pages, ...cats, ...products];
}
