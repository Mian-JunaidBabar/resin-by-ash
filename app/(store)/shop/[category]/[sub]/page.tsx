import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ShopPageSkeleton } from "@/components/store/shop-skeleton";
import { ShopView } from "@/components/store/shop-view";
import { getCategories, getCategoryByPath, getCategoryRedirect, getCategoryStaticParams } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import type { Category } from "@/lib/types";

type Params = Promise<{ category: string; sub: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateStaticParams() {
  const paths = await getCategoryStaticParams();
  return paths.filter((p) => p.sub).map(({ category, sub }) => ({ category, sub: sub! }));
}

function metaFor(category: Category, parent: Category, liveCount: number): Metadata {
  const path = `/shop/${parent.slug}/${category.slug}`;
  const image = category.ogImage ?? category.image ?? parent.ogImage ?? parent.image;
  return {
    title: { absolute: category.metaTitle ?? `${category.name} · Handmade resin in Pakistan` },
    description: category.seoDescription,
    alternates: { canonical: path },
    robots: liveCount === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: path,
      title: category.metaTitle ?? `${category.name} · Resin by Ash`,
      description: category.seoDescription,
      ...(image ? { images: [{ url: absoluteUrl(image), alt: category.name }] } : {}),
    },
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, sub } = await params;
  const data = await getCategoryByPath(category, sub);
  if (!data?.parent) {
    const redirectTo = await getCategoryRedirect(`/shop/${category}/${sub}`);
    if (redirectTo) permanentRedirect(redirectTo);
    notFound();
  }
  return metaFor(data.category, data.parent, data.liveCount);
}

export default function ChildCategoryPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ChildCategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ChildCategoryContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { category, sub } = await params;
  const [data, categories] = await Promise.all([getCategoryByPath(category, sub), getCategories()]);

  if (!data?.parent) {
    const redirectTo = await getCategoryRedirect(`/shop/${category}/${sub}`);
    if (redirectTo) permanentRedirect(redirectTo);
    notFound();
  }

  return (
    <ShopView category={data.category} parent={data.parent} categories={categories} searchParams={searchParams} />
  );
}
