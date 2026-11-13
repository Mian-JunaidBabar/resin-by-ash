import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit category" };

type Params = Promise<{ id: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export default function EditCategoryPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading category…</p>}>
      <EditCategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditCategoryContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [category, parents, targets, productCount, childCount] = await Promise.all([
    db.category.findUnique({ where: { id } }),
    db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ where: { NOT: { id } }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }], select: { id: true, name: true } }),
    db.product.count({ where: { categoryId: id } }),
    db.category.count({ where: { parentId: id } }),
  ]);
  if (!category) notFound();

  return (
    <CategoryForm
      category={category}
      parents={parents}
      moveTargets={targets}
      productCount={productCount}
      childCount={childCount}
      saved={sp.saved === "1"}
      error={typeof sp.error === "string" ? sp.error : undefined}
      message={typeof sp.message === "string" ? decodeURIComponent(sp.message) : undefined}
    />
  );
}
