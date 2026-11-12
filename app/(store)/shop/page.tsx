import type { Metadata } from "next";
import { ShopView } from "@/components/store/shop-view";
import { getCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Shop handmade resin pieces",
  description:
    "Browse every piece from the Resin by Ash studio: nikkah trays and pens, resin jewellery, flower preservation, keychains, watches and gifts. Search, filter by price and occasion, Cash on Delivery nationwide.",
  alternates: { canonical: "/shop" },
  openGraph: { url: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const categories = await getCategories();
  return <ShopView categories={categories} searchParams={searchParams} />;
}
