"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_LABEL, normalisePhone } from "@/lib/orders";
import { getSettings } from "@/lib/queries";
import { customQuoteMessage, waLink } from "@/lib/whatsapp";

const idFrom = (value: FormDataEntryValue | null) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function sendQuote(
  requestId: number,
  amount: number,
  readyBy: string,
): Promise<{ ok: true; waUrl: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!Number.isInteger(amount) || amount <= 0 || amount > 10_000_000) {
    return { ok: false, error: "Enter a quote in rupees." };
  }
  const ready = readyBy && !Number.isNaN(Date.parse(`${readyBy}T00:00:00+05:00`))
    ? new Date(`${readyBy}T00:00:00+05:00`)
    : null;
  if (!ready) return { ok: false, error: "Choose a ready-by date." };

  const request = await db.customRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "That request no longer exists." };

  const settings = await getSettings();
  const message = customQuoteMessage({
    name: request.name,
    item: request.item,
    quote: amount,
    readyBy: readyBy,
  });

  await db.customRequest.update({
    where: { id: requestId },
    data: { quote: amount, readyBy: ready, status: "QUOTED" },
  });
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);

  return { ok: true, waUrl: waLink(message, settings.whatsappNumber) };
}

export async function acceptRequest(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData.get("id"));
  if (!id) redirect("/admin/requests?error=invalid");
  await db.customRequest.update({ where: { id }, data: { status: "ACCEPTED" } });
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
}

export async function declineRequest(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData.get("id"));
  if (!id) redirect("/admin/requests?error=invalid");
  await db.customRequest.update({ where: { id }, data: { status: "DECLINED" } });
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
}

/** Creates a real order from an accepted request and links the two records. */
export async function convertToOrder(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData.get("id"));
  if (!id) redirect("/admin/requests?error=invalid");

  const existing = await db.customRequest.findUnique({ where: { id }, include: { order: true } });
  if (!existing) redirect("/admin/requests?error=missing");
  if (existing.orderId) {
    const settings = await getSettings();
    redirect(`/admin/orders/${ORDER_LABEL(settings.orderPrefix, existing.order?.number ?? 0)}`);
  }

  const settings = await getSettings();
  const phone = normalisePhone(existing.phone) ?? existing.phone;
  const amount = existing.quote ?? 0;
  const message = customQuoteMessage({
    name: existing.name,
    item: existing.item,
    quote: amount,
    readyBy: existing.readyBy?.toISOString().slice(0, 10),
  });

  const order = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone },
      update: { name: existing.name, city: existing.city ?? "Other city" },
      create: { name: existing.name, phone, city: existing.city ?? "Other city" },
    });
    const created = await tx.order.create({
      data: {
        customerId: customer.id,
        name: existing.name,
        phone,
        city: existing.city ?? "Other city",
        address: "To confirm on WhatsApp",
        notes: existing.description,
        subtotal: amount,
        savings: 0,
        delivery: 0,
        total: amount,
        payment: "COD",
        status: "NEW",
        whatsappMessage: message,
        lines: {
          create: {
            name: `Custom request #${existing.id} — ${existing.item}`,
            personalisation: { requestId: existing.id, description: existing.description },
            qty: 1,
            unitPrice: amount,
            unitWas: amount,
          },
        },
        events: { create: { label: `Converted from custom request #${existing.id}` } },
      },
    });
    await tx.customRequest.update({
      where: { id: existing.id },
      data: { orderId: created.id, status: "ACCEPTED" },
    });
    return created;
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders/${ORDER_LABEL(settings.orderPrefix, order.number)}`);
}

export async function toggleMessageHandled(formData: FormData) {
  await requireAdmin();
  const id = typeof formData.get("id") === "string" ? String(formData.get("id")) : "";
  const handled = formData.get("handled") === "true";
  if (!id) redirect("/admin/requests/messages");
  await db.contactMessage.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/requests/messages");
  updateTag("settings");
}
