import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form-db";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit product" };

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export default function EditProductPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading product…</p>}>
      <EditProductContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProductContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  await requireAdmin();
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
      },
    }),
    db.category.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }], select: { id: true, name: true, parentId: true } }),
  ]);
  if (!product) notFound();
  const flat = categories
    .filter((c) => !c.parentId)
    .flatMap((top) => [
      { id: top.id, name: top.name, depth: 0 },
      ...categories.filter((c) => c.parentId === top.id).map((c) => ({ id: c.id, name: c.name, depth: 1 })),
    ]);

  return (
    <ProductForm
      product={product}
      categories={flat}
      saved={sp.saved === "1"}
      error={typeof sp.error === "string" ? sp.error : undefined}
      message={typeof sp.message === "string" ? decodeURIComponent(sp.message) : undefined}
    />
  );
}
