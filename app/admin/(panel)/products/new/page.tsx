import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form-db";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New product" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function NewProductPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading…</p>}>
      <NewProductContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewProductContent({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await db.category.findMany({
    where: { status: "LIVE" },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true, parentId: true },
  });
  const flat = categories
    .filter((c) => !c.parentId)
    .flatMap((top) => [
      { id: top.id, name: top.name, depth: 0 },
      ...categories.filter((c) => c.parentId === top.id).map((c) => ({ id: c.id, name: c.name, depth: 1 })),
    ]);
  return (
    <ProductForm
      categories={flat}
      error={typeof sp.error === "string" ? sp.error : undefined}
      message={typeof sp.message === "string" ? decodeURIComponent(sp.message) : undefined}
    />
  );
}
