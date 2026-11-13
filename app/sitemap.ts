import type { MetadataRoute } from "next";
import { getCategoryTree, getProducts } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap from the database: static pages, every LIVE category and child, and
 * every LIVE product. Category lastModified is the newest product update in it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, products] = await Promise.all([getCategoryTree(), getProducts()]);

  const staticPages = ["/", "/shop", "/custom", "/about", "/faq", "/contact"].map((p) => ({
    url: absoluteUrl(p),
    changeFrequency: p === "/" || p === "/shop" ? ("daily" as const) : ("monthly" as const),
    priority: p === "/" ? 1 : p === "/shop" ? 0.9 : 0.6,
  }));

  const lastFor = (topSlug: string, childName?: string) =>
    products
      .filter((p) => p.category === topSlug && (!childName || p.subcategory === childName))
      .reduce<string | undefined>((latest, p) => (!latest || p.createdAt > latest ? p.createdAt : latest), undefined);

  const categories = tree.flatMap((top) => {
    const topLast = lastFor(top.slug);
    return [
      {
        url: absoluteUrl(`/shop/${top.slug}`),
        ...(topLast ? { lastModified: topLast } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      ...(top.children ?? []).map((child) => {
        const last = lastFor(top.slug, child.name);
        return {
          url: absoluteUrl(`/shop/${top.slug}/${child.slug}`),
          ...(last ? { lastModified: last } : {}),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      }),
    ];
  });

  const productPages = products.map((p) => ({
    url: absoluteUrl(`/product/${p.slug}`),
    lastModified: p.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    images: p.images.map((i) => absoluteUrl(i)),
  }));

  return [...staticPages, ...categories, ...productPages];
}
