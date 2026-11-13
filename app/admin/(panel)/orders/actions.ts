"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { storeMedia } from "@/lib/uploads";

const STATUS_EVENTS: Record<OrderStatus, string> = {
  New: "Order placed on site",
  Confirmed: "Confirmed on WhatsApp",
  "In progress": "In progress",
  Shipped: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

function refresh(orderId: string) {
  revalidateTag("orders", "max");
  revalidateTag("products", "max");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const value = ORDER_STATUS_VALUES[status];
  if (!id || !value) return;
  const order = await db.order.findUnique({ where: { id }, select: { number: true, status: true } });
  if (!order) return;
  await db.$transaction([
    db.order.update({ where: { id }, data: { status: value } }),
    ...(order.status === value ? [] : [db.orderEvent.create({ data: { orderId: id, label: STATUS_EVENTS[status] } })]),
  ]);
  refresh(ORDER_STATUS_LABELS[value] ?? String(order.number));
}

export async function savePrivateNote(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const note = String(formData.get("privateNote") ?? "").slice(0, 2000);
  await db.order.update({ where: { id }, data: { privateNote: note } });
  revalidatePath(`/admin/orders/${id}`);
}

export async function addProgressPhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const file = formData.get("photo");
  if (!id || !(file instanceof File) || !file.size) return;
  const stored = await storeMedia(file);
  if (stored.isVideo) return;
  await db.$transaction([
    db.order.update({ where: { id }, data: { progressPhotos: { push: stored.url } } }),
    db.orderEvent.create({ data: { orderId: id, label: "Progress photo shared" } }),
  ]);
  refresh(id);
}

export async function setShipBy(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("shipBy") ?? "");
  if (!id) return;
  await db.order.update({
    where: { id },
    data: { shipBy: date ? new Date(`${date}T12:00:00+05:00`) : null },
  });
  revalidatePath(`/admin/orders/${id}`);
}
