import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/admin/order-detail";
import { db } from "@/lib/db";
import { ORDER_LABEL, ORDER_STATUS_LABELS, adminDate, personalisationText, optionsLabel } from "@/lib/orders";
import { getSettings } from "@/lib/queries";
import type { OrderStatus } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const number = Number(id.replace(/\D/g, ""));
  if (!Number.isSafeInteger(number) || number <= 0) notFound();
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { number },
      include: {
        customer: { include: { _count: { select: { orders: true } } } },
        lines: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    }),
    getSettings(),
  ]);
  if (!order) notFound();

  const status = ORDER_STATUS_LABELS[order.status] as OrderStatus;
  const timeline = order.events.map((e) => ({ label: e.label, at: adminDate(e.createdAt), done: true }));
  if (order.shipBy) {
    timeline.push({
      label: "Ship by",
      at: order.shipBy.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" }),
      done: false,
    });
  }

  return (
    <OrderDetail
      order={{
        dbId: order.id,
        id: ORDER_LABEL(settings.orderPrefix, order.number),
        createdAt: adminDate(order.createdAt),
        status,
        customer: {
          name: order.customer.name,
          phone: order.phone,
          city: order.city,
          address: order.address,
          orderCount: order.customer._count.orders,
        },
        lines: order.lines.map((l) => ({
          name: l.name,
          options: optionsLabel(l.size, l.colour),
          personal: personalisationText(l.personalisation as Record<string, string>),
          referenceImage:
            typeof (l.personalisation as Record<string, unknown>).referenceImage === "string"
              ? String((l.personalisation as Record<string, unknown>).referenceImage)
              : undefined,
          qty: l.qty,
          unitPrice: l.unitPrice,
          unitWas: l.unitWas,
        })),
        notes: order.notes ?? undefined,
        privateNote: order.privateNote ?? "",
        subtotal: order.subtotal,
        savings: order.savings,
        delivery: order.delivery,
        total: order.total,
        progressPhotos: order.progressPhotos,
        shipBy: order.shipBy ? order.shipBy.toISOString().slice(0, 10) : "",
        whatsappMessage: order.whatsappMessage,
        waPhone: `92${order.phone.replace(/\D/g, "").replace(/^0/, "")}`,
        timeline,
      }}
    />
  );
}
