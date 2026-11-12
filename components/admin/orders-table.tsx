"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { StatusPill, abtnChat, abtnGhost } from "@/components/admin/ui";
import { ORDER_ROWS, ORDER_STATUSES } from "@/lib/data/admin";
import { rs } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function OrdersTable() {
  const [tab, setTab] = useState<"All" | OrderStatus>("All");
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      ORDER_ROWS.filter((o) => tab === "All" || o.status === tab).filter((o) =>
        q ? `${o.id} ${o.name} ${o.phone} ${o.city}`.toLowerCase().includes(q.toLowerCase()) : true,
      ),
    [tab, q],
  );
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl leading-[1.05] font-semibold">Orders</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative block">
            <span className="sr-only">Search orders</span>
            <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order ID, name or phone"
              className="h-[42px] w-[260px] rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm"
            />
          </label>
          {/* Phase 2: GET /admin/orders/export.csv route handler */}
          <button type="button" className={abtnGhost}>
            Export CSV
          </button>
        </div>
      </div>
      <div role="tablist" aria-label="Order status" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-sand-2">
        {(["All", ...ORDER_STATUSES] as const).map((t) => {
          const on = tab === t;
          const count = t === "All" ? ORDER_ROWS.length : ORDER_ROWS.filter((o) => o.status === t).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t)}
              className={`-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${
                on ? "border-caramel font-bold" : "border-transparent font-medium hover:text-caramel"
              }`}
            >
              {t}
              <span className="rounded-full bg-sand px-2 py-px text-[11px] font-semibold">{count}</span>
            </button>
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
              <tr key={o.id} className="border-t border-sand transition-colors hover:bg-sand-3">
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
                  <a href={waLink()} target="_blank" rel="noopener" className={abtnChat}>
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
          Showing {rows.length} of 46 orders
        </span>
        <div className="flex gap-2">
          <button type="button" className={abtnGhost} disabled>
            Previous
          </button>
          <button type="button" className={abtnGhost}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
