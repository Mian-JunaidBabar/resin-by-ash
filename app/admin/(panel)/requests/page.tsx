import type { Metadata } from "next";
import { RequestsInbox } from "@/components/admin/requests-inbox";

export const metadata: Metadata = { title: "Custom requests" };

export default function RequestsPage() {
  return <RequestsInbox />;
}
