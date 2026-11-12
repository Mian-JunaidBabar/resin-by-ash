import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/orders-table";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return <OrdersTable />;
}
