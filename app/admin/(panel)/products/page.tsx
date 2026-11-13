import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { ProductsTable } from "@/components/admin/products-table";
import { CATEGORIES, PRODUCTS } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireAdmin();
  return <ProductsTable products={PRODUCTS} categories={CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }))} />;
}
