import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { CATEGORIES, PRODUCTS } from "@/lib/data/catalog";

export function generateStaticParams() {
  return [{ id: "new" }, ...PRODUCTS.map((p) => ({ id: p.id }))];
}

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: id === "new" ? "New product" : (PRODUCTS.find((p) => p.id === id)?.name ?? "Product") };
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const product = id === "new" ? undefined : PRODUCTS.find((p) => p.id === id);
  if (id !== "new" && !product) notFound();
  return <ProductForm product={product} categories={CATEGORIES} />;
}
