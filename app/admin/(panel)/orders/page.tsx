import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/orders-table";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requireAdmin();
  return <OrdersTable />;
}
