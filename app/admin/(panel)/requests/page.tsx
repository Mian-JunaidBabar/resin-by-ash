import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { RequestsInbox } from "@/components/admin/requests-inbox";

export const metadata: Metadata = { title: "Custom requests" };

export default async function RequestsPage() {
  await requireAdmin();
  return <RequestsInbox />;
}
