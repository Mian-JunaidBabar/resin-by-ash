import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading…</p>}>
      <NewCategoryContent />
    </Suspense>
  );
}

async function NewCategoryContent() {
  await requireAdmin();
  const parents = await db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <CategoryForm parents={parents} moveTargets={[]} productCount={0} childCount={0} />;
}
