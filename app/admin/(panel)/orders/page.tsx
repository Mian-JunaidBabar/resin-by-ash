import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/orders-table";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABELS, shortDate } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 20;
const TABS: OrderStatus[] = ["New", "Confirmed", "In progress", "Shipped", "Delivered", "Cancelled"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = (TABS as string[]).includes(one(sp.status)) ? (one(sp.status) as OrderStatus) : "All";
  const q = one(sp.q).slice(0, 80);
  const from = one(sp.from);
  const to = one(sp.to);
  const page = Math.max(1, Math.floor(Number(one(sp.page)) || 1));

  const statusValue = tab === "All" ? undefined : (Object.entries(ORDER_STATUS_LABELS).find(([, label]) => label === tab)?.[0] as
    | "NEW"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | undefined);

  const digits = q.replace(/\D/g, "");
  const where = {
    ...(statusValue ? { status: statusValue } : {}),
    ...(q
      ? {
          OR: [
            ...(digits ? [{ number: Number(digits) }] : []),
            { name: { contains: q, mode: "insensitive" as const } },
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
  };

  const [counts, total, rows] = await Promise.all([
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { lines: { select: { name: true, qty: true } } },
    }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const tabCounts = Object.fromEntries(TABS.map((t) => [t, countBy[Object.entries(ORDER_STATUS_LABELS).find(([, l]) => l === t)?.[0] ?? ""] ?? 0]));

  return (
    <OrdersTable
      rows={rows.map((o) => ({
        id: `RBA-${o.number}`,
        dbId: o.id,
        date: shortDate(o.createdAt),
        name: o.name,
        phone: o.phone,
        city: o.city,
        items: o.lines.map((l) => `${l.name} ×${l.qty}`).join(", "),
        total: o.total,
        status: ORDER_STATUS_LABELS[o.status],
      }))}
      counts={{ All: counts.reduce((sum, c) => sum + c._count._all, 0), ...tabCounts }}
      tab={tab}
      q={q}
      from={from}
      to={to}
      page={page}
      total={total}
    />
  );
}
