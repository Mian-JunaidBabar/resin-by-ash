import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { Card, PageTitle, StatusPill, Thumb, abtnChat, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { ORDER_LABEL, ORDER_STATUS_LABELS, SOLD_STATUSES, shortDate } from "@/lib/orders";
import { rs } from "@/lib/pricing";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };

function age(date: Date) {
  const mins = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `${mins} m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function startOfDayPKT() {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return new Date(`${day}T00:00:00+05:00`);
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysAhead = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export default async function DashboardPage() {
  await requireAdmin();
  const settings = await getSettings();
  const today = startOfDayPKT();
  const monthStart = new Date(today);
  monthStart.setDate(monthStart.getDate() - 30);
  const twoHoursAgo = hoursAgo(2);
  const threeDaysAgo = daysAgo(3);
  const weekAhead = daysAhead(7);

  const [todayCount, toMake, monthSales, collected, followNew, followProgress, followReview, recent, soldLines, due, orderCount] =
    await Promise.all([
      db.order.count({ where: { createdAt: { gte: today }, status: "NEW" } }),
      db.order.count({ where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
      db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: monthStart }, status: { in: [...SOLD_STATUSES] } } }),
      db.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
      db.order.findMany({ where: { status: "NEW", createdAt: { lte: twoHoursAgo } }, orderBy: { createdAt: "asc" }, take: 3 }),
      db.order.findMany({ where: { status: "IN_PROGRESS", progressPhotos: { equals: [] } }, orderBy: { updatedAt: "asc" }, take: 2 }),
      db.order.findMany({ where: { status: "DELIVERED", updatedAt: { lte: threeDaysAgo } }, orderBy: { updatedAt: "desc" }, take: 2 }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      db.orderLine.findMany({
        where: { order: { createdAt: { gte: monthStart }, status: { in: [...SOLD_STATUSES] } } },
        include: { product: { select: { name: true, toneBg: true, images: { take: 1, orderBy: { position: "asc" } } } } },
      }),
      db.order.findMany({
        where: { shipBy: { gte: today, lte: weekAhead }, status: { notIn: ["DELIVERED", "CANCELLED"] } },
        orderBy: { shipBy: "asc" },
        take: 4,
      }),
      db.order.count(),
    ]);

  const sold = new Map<string, { name: string; tone: string; qty: number }>();
  for (const line of soldLines) {
    const key = line.productId ?? line.name;
    const current = sold.get(key) ?? { name: line.product?.name ?? line.name, tone: line.product?.toneBg ?? "#F1EBE4", qty: 0 };
    current.qty += line.qty;
    sold.set(key, current);
  }
  const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 4);

  const followUps = [
    ...followNew.map((o) => ({
      initials: o.name.slice(0, 2).toUpperCase(),
      name: o.name,
      ref: ORDER_LABEL(settings.orderPrefix, o.number),
      reason: "Order sent on WhatsApp, not confirmed yet",
      age: age(o.createdAt),
      href: `/admin/orders/${ORDER_LABEL(settings.orderPrefix, o.number)}`,
      phone: `92${o.phone.replace(/\D/g, "").replace(/^0/, "")}`,
    })),
    ...followProgress.map((o) => ({
      initials: o.name.slice(0, 2).toUpperCase(),
      name: o.name,
      ref: ORDER_LABEL(settings.orderPrefix, o.number),
      reason: "In progress — send a progress photo",
      age: age(o.updatedAt),
      href: `/admin/orders/${ORDER_LABEL(settings.orderPrefix, o.number)}`,
      phone: `92${o.phone.replace(/\D/g, "").replace(/^0/, "")}`,
    })),
    ...followReview.map((o) => ({
      initials: o.name.slice(0, 2).toUpperCase(),
      name: o.name,
      ref: ORDER_LABEL(settings.orderPrefix, o.number),
      reason: "Delivered 3 days ago, ask for a review photo",
      age: age(o.updatedAt),
      href: `/admin/orders/${ORDER_LABEL(settings.orderPrefix, o.number)}`,
      phone: `92${o.phone.replace(/\D/g, "").replace(/^0/, "")}`,
    })),
  ];

  const stats = [
    { label: "New orders today", value: String(todayCount), sub: orderCount ? `${orderCount} orders in total` : "No orders yet", href: "/admin/orders" },
    { label: "To make", value: String(toMake), sub: "Confirmed + in progress", href: "/admin/orders?status=Confirmed" },
    { label: "Sales this month", value: rs(monthSales._sum.total ?? 0), sub: "Confirmed orders and later", href: "/admin/orders" },
    { label: "COD collected", value: rs(collected._sum.total ?? 0), sub: "Delivered orders", href: "/admin/orders?status=Delivered" },
  ];

  return (
    <>
      <PageTitle
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Karachi" })}
        title="Welcome back, Ash"
        actions={
          <>
            <Link href="/" className={abtnGhost}>
              View store
            </Link>
            <Link href="/admin/products/new" className={abtnPrimary}>
              <PlusIcon size={16} /> Add product
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex flex-col gap-1.5 rounded-[14px] border border-sand-2 bg-white px-[18px] py-4 no-underline transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <span className="text-[13px] font-medium text-cocoa">{s.label}</span>
            <strong className="text-[30px] leading-[1.1] font-bold">{s.value}</strong>
            <span className="text-xs">{s.sub}</span>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-start gap-[18px]">
        <Card
          pad={false}
          title="Follow up"
          action={<span className="rounded-full bg-st-new-bg px-2.5 py-[3px] text-xs font-semibold text-st-new-fg">{followUps.length} waiting</span>}
        >
          {followUps.map((f) => (
            <div key={`${f.ref}-${f.reason}`} className="flex items-center gap-3 border-b border-sand px-[18px] py-3 last:border-0">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-[13px] font-bold">
                {f.initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {f.name} <Link href={f.href} className="font-normal text-cocoa underline underline-offset-2">· {f.ref}</Link>
                </span>
                <span className="text-[13px]">{f.reason}</span>
              </div>
              <span className="text-xs whitespace-nowrap text-cocoa">{f.age}</span>
              <a href={`https://wa.me/${f.phone}`} target="_blank" rel="noopener" className={abtnChat}>
                Open chat
              </a>
            </div>
          ))}
          {!followUps.length ? <p className="px-[18px] py-6 text-sm text-cocoa">Nothing needs chasing. Lovely.</p> : null}
        </Card>
        <Card
          pad={false}
          title="Recent orders"
          action={
            <Link href="/admin/orders" className="text-[13px] font-semibold underline underline-offset-[3px]">
              All orders
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-[13px]">
              <thead className="text-cocoa">
                <tr>
                  {["Order", "Customer", "Total", "Status"].map((h) => (
                    <th key={h} className="px-[18px] py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-sand">
                    <td className="px-[18px] py-2.5">
                      <Link href={`/admin/orders/${ORDER_LABEL(settings.orderPrefix, o.number)}`} className="font-bold underline underline-offset-[3px]">
                        {ORDER_LABEL(settings.orderPrefix, o.number)}
                      </Link>
                    </td>
                    <td className="px-[18px] py-2.5">
                      {o.name}
                      <br />
                      <span className="text-cocoa">{o.city}</span>
                    </td>
                    <td className="px-[18px] py-2.5 font-semibold">{rs(o.total)}</td>
                    <td className="px-[18px] py-2.5">
                      <StatusPill status={ORDER_STATUS_LABELS[o.status]} />
                    </td>
                  </tr>
                ))}
                {!recent.length ? (
                  <tr>
                    <td colSpan={4} className="px-[18px] py-6 text-sm text-cocoa">
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Top sellers this month">
          {top.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <Thumb tone={t.tone} />
              <span className="flex-1 text-sm font-medium">{t.name}</span>
              <span className="text-[13px] text-cocoa">{t.qty} sold</span>
            </div>
          ))}
          {!top.length ? <p className="text-sm text-cocoa">Sales will appear here once orders are confirmed.</p> : null}
        </Card>
        <Card title="Due this week">
          {due.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 border-b border-sand pb-3 last:border-0 last:pb-0">
              <span>
                <strong className="text-sm font-semibold">
                  <Link href={`/admin/orders/${ORDER_LABEL(settings.orderPrefix, d.number)}`} className="underline underline-offset-[3px]">
                    {ORDER_LABEL(settings.orderPrefix, d.number)}
                  </Link>
                </strong>
                <br />
                <span className="text-[13px] text-cocoa">{d.name}</span>
              </span>
              <span className="text-[13px] font-semibold whitespace-nowrap">{d.shipBy ? shortDate(d.shipBy) : ""}</span>
            </div>
          ))}
          {!due.length ? <p className="text-sm text-cocoa">No ship-by dates in the next 7 days.</p> : null}
        </Card>
      </div>
    </>
  );
}
