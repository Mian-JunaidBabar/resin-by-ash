import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ShopPageSkeleton } from "@/components/store/shop-skeleton";
import { ShopView } from "@/components/store/shop-view";
import { getCategories, getCategoryByPath, getCategoryRedirect, getCategoryStaticParams } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import type { Category } from "@/lib/types";

type Params = Promise<{ category: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateStaticParams() {
  const paths = await getCategoryStaticParams();
  return paths.filter((p) => !p.sub).map(({ category }) => ({ category }));
}

function metaFor(category: Category, liveCount: number): Metadata {
  const image = category.ogImage ?? category.image;
  return {
    title: { absolute: category.metaTitle ?? `${category.name} · Handmade resin in Pakistan` },
    description: category.seoDescription,
    alternates: { canonical: `/shop/${category.slug}` },
    robots: liveCount === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: `/shop/${category.slug}`,
      title: category.metaTitle ?? `${category.name} · Resin by Ash`,
      description: category.seoDescription,
      ...(image ? { images: [{ url: absoluteUrl(image), alt: category.name }] } : {}),
    },
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const data = await getCategoryByPath(category);
  if (!data) {
    const redirectTo = await getCategoryRedirect(`/shop/${category}`);
    if (redirectTo) permanentRedirect(redirectTo);
    notFound();
  }
  return metaFor(data.category, data.liveCount);
}

export default function CategoryPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { category } = await params;
  const [data, categories] = await Promise.all([getCategoryByPath(category), getCategories()]);

  if (!data) {
    const redirectTo = await getCategoryRedirect(`/shop/${category}`);
    if (redirectTo) permanentRedirect(redirectTo);
    notFound();
  }

  return <ShopView category={data.category} categories={categories} searchParams={searchParams} />;
}
