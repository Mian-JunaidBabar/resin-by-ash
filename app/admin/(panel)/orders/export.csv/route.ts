import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_LABEL, ORDER_STATUS_LABELS } from "@/lib/orders";
import { getSettings } from "@/lib/queries";

const cell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const statusEntry = Object.entries(ORDER_STATUS_LABELS).find(([, label]) => label === status);
  const digits = q.replace(/\D/g, "");

  const [settings, orders] = await Promise.all([
    getSettings(),
    db.order.findMany({
      where: {
        ...(statusEntry ? { status: statusEntry[0] as "NEW" } : {}),
        ...(q
          ? {
              OR: [
                ...(digits ? [{ number: Number(digits) }] : []),
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
              ],
            }
          : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(`${from}T00:00:00+05:00`) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59+05:00`) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { lines: { select: { name: true, qty: true } } },
    }),
  ]);

  const header = ["Order", "Date", "Customer", "Phone", "City", "Address", "Items", "Subtotal", "Delivery", "Total", "Payment", "Status"];
  const rows = orders.map((o) => [
    ORDER_LABEL(settings.orderPrefix, o.number),
    o.createdAt.toISOString(),
    o.name,
    o.phone,
    o.city,
    o.address,
    o.lines.map((l) => `${l.name} x${l.qty}`).join("; "),
    o.subtotal,
    o.delivery,
    o.total,
    o.payment,
    ORDER_STATUS_LABELS[o.status],
  ]);
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resin-by-ash-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
