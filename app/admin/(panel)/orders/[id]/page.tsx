import type { Metadata } from "next";
import { OrderDetail } from "@/components/admin/order-detail";
import { ORDER_ROWS, SAMPLE_ORDER } from "@/lib/data/admin";

export function generateStaticParams() {
  return ORDER_ROWS.map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

/** Phase 2: load the order by id from the database (behind auth) and notFound() when missing. */
export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const row = ORDER_ROWS.find((o) => o.id === id);
  const order = row && row.id !== SAMPLE_ORDER.id
    ? { ...SAMPLE_ORDER, id: row.id, status: row.status, customer: { ...SAMPLE_ORDER.customer, name: row.name, phone: row.phone, city: row.city } }
    : SAMPLE_ORDER;
  return <OrderDetail order={order} />;
}
