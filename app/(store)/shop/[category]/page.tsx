import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/store/shop-view";
import { CATEGORIES } from "@/lib/data/catalog";
import { getCategories, getCategory } from "@/lib/queries";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = await getCategory(category);
  if (!c) return {};
  return {
    title: `${c.name} · Handmade resin`,
    description: c.seoDescription,
    alternates: { canonical: `/shop/${c.slug}` },
    openGraph: { url: `/shop/${c.slug}`, title: `${c.name} · Resin by Ash`, description: c.seoDescription },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  const { category } = await params;
  const [c, categories] = await Promise.all([getCategory(category), getCategories()]);
  if (!c) notFound();
  return <ShopView category={c} categories={categories} searchParams={searchParams} />;
}
