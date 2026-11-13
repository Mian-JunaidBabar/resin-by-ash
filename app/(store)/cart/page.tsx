import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { getDeliveryZones } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your pieces and place your order on WhatsApp. Cash on Delivery anywhere in Pakistan.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default async function CartPage() {
  const zones = await getDeliveryZones();
  return <CartView zones={zones} />;
}
