import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { Card, PageTitle, StatusPill, Thumb, abtnChat, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { DASH_STATS, DUE_THIS_WEEK, FOLLOW_UPS, ORDER_ROWS } from "@/lib/data/admin";
import { PRODUCTS } from "@/lib/data/catalog";
import { rs } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const top = [...PRODUCTS].sort((a, b) => b.soldCount - a.soldCount).slice(0, 4);
  return (
    <>
      <PageTitle
        eyebrow="Thursday, 12 November"
        title="Good evening, Ash"
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
        {DASH_STATS.map((s) => (
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
          action={<span className="rounded-full bg-st-new-bg px-2.5 py-[3px] text-xs font-semibold text-st-new-fg">{FOLLOW_UPS.length} waiting</span>}
        >
          {FOLLOW_UPS.map((f) => (
            <div key={f.ref} className="flex items-center gap-3 border-b border-sand px-[18px] py-3 last:border-0">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-[13px] font-bold">
                {f.initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {f.name} <span className="font-normal text-cocoa">· {f.ref}</span>
                </span>
                <span className="text-[13px]">{f.reason}</span>
              </div>
              <span className="text-xs whitespace-nowrap text-cocoa">{f.age}</span>
              <a href={waLink()} target="_blank" rel="noopener" className={abtnChat}>
                Open chat
              </a>
            </div>
          ))}
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
                {ORDER_ROWS.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-t border-sand">
                    <td className="px-[18px] py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold underline underline-offset-[3px]">
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-[18px] py-2.5">
                      {o.name}
                      <br />
                      <span className="text-cocoa">{o.city}</span>
                    </td>
                    <td className="px-[18px] py-2.5 font-semibold">{rs(o.total)}</td>
                    <td className="px-[18px] py-2.5">
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Top sellers this month">
          {top.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <Thumb tone={t.tone[0]} />
              <span className="flex-1 text-sm font-medium">{t.name}</span>
              <span className="text-[13px] text-cocoa">{t.soldCount} sold</span>
            </div>
          ))}
        </Card>
        <Card title="Due this week">
          {DUE_THIS_WEEK.map((d) => (
            <div key={d.who} className="flex items-center justify-between gap-3 border-b border-sand pb-3 last:border-0 last:pb-0">
              <span>
                <strong className="text-sm font-semibold">{d.what}</strong>
                <br />
                <span className="text-[13px] text-cocoa">{d.who}</span>
              </span>
              <span className="text-[13px] font-semibold whitespace-nowrap">{d.when}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
