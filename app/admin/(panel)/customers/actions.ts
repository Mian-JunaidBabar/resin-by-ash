"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function updateCustomerTag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tag = String(formData.get("tag") ?? "").trim().slice(0, 40);
  if (!id) redirect("/admin/customers");
  await db.customer.update({ where: { id }, data: { tag: tag || null } });
  revalidatePath("/admin/customers");
}
