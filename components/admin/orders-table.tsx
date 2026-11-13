"use client";

import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { StatusPill, abtnChat, abtnGhost } from "@/components/admin/ui";
import { rs } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";

type Row = {
  id: string;
  dbId: string;
  date: string;
  name: string;
  phone: string;
  city: string;
  items: string;
  total: number;
  status: OrderStatus;
};

const TABS: ("All" | OrderStatus)[] = ["All", "New", "Confirmed", "In progress", "Shipped", "Delivered", "Cancelled"];
const PAGE_SIZE = 20;

export function OrdersTable({
  rows,
  counts,
  tab,
  q,
  from,
  to,
  page,
  total,
}: {
  rows: Row[];
  counts: Record<string, number>;
  tab: "All" | OrderStatus;
  q: string;
  from: string;
  to: string;
  page: number;
  total: number;
}) {
  const query = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const values = { status: tab === "All" ? "" : tab, q, from, to, page: "", ...overrides };
    for (const [key, value] of Object.entries(values)) {
      if (value !== "" && value != null) params.set(key, String(value));
    }
    const str = params.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl leading-[1.05] font-semibold">Orders</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <form action="/admin/orders" className="flex flex-wrap items-center gap-2.5">
            {tab !== "All" ? <input type="hidden" name="status" value={tab} /> : null}
            <label className="relative block">
              <span className="sr-only">Search orders</span>
              <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Order ID, name or phone"
                className="h-[42px] w-[240px] rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-cocoa">
              From
              <input type="date" name="from" defaultValue={from} className="h-[42px] rounded-[10px] border border-line bg-white px-2 text-sm" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-cocoa">
              To
              <input type="date" name="to" defaultValue={to} className="h-[42px] rounded-[10px] border border-line bg-white px-2 text-sm" />
            </label>
            <button type="submit" className={abtnGhost}>
              Filter
            </button>
          </form>
          <a href={`/admin/orders/export.csv${query({ page: undefined }).replace("/admin/orders", "")}`} className={abtnGhost}>
            Export CSV
          </a>
        </div>
      </div>
      <div role="tablist" aria-label="Order status" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-sand-2">
        {TABS.map((t) => {
          const on = tab === t;
          return (
            <Link
              key={t}
              role="tab"
              aria-selected={on}
              href={query({ status: t === "All" ? "" : t, page: undefined })}
              className={`-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${
                on ? "border-caramel font-bold" : "border-transparent font-medium hover:text-caramel"
              }`}
            >
              {t}
              <span className="rounded-full bg-sand px-2 py-px text-[11px] font-semibold">{counts[t] ?? 0}</span>
            </Link>
          );
        })}
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-sand-2 bg-white">
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="text-cocoa">
            <tr>
              {["Order", "Date", "Customer", "City", "Items", "Total", "Payment", "Status", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.dbId} className="border-t border-sand transition-colors hover:bg-sand-3">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-bold underline underline-offset-[3px]">
                    {o.id}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{o.date}</td>
                <td className="px-4 py-3">
                  {o.name}
                  <br />
                  <span className="text-cocoa">{o.phone}</span>
                </td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="max-w-[240px] px-4 py-3">{o.items}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{rs(o.total)}</td>
                <td className="px-4 py-3">COD</td>
                <td className="px-4 py-3">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <a href={`https://wa.me/92${o.phone.slice(1)}`} target="_blank" rel="noopener" className={abtnChat}>
                    Open chat
                  </a>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-cocoa">
                  No orders match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span>
          Showing {rows.length} of {total} orders
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={query({ page: page - 1 })} className={abtnGhost}>
              Previous
            </Link>
          ) : (
            <span className={`${abtnGhost} pointer-events-none opacity-50`}>Previous</span>
          )}
          {page < pages ? (
            <Link href={query({ page: page + 1 })} className={abtnGhost}>
              Next
            </Link>
          ) : (
            <span className={`${abtnGhost} pointer-events-none opacity-50`}>Next</span>
          )}
        </div>
      </div>
    </>
  );
}
