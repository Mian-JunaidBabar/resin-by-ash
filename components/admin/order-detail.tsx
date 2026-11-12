"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { Card, PageTitle, StatusPill, Thumb, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/data/admin";
import { rs } from "@/lib/pricing";
import type { Order, OrderStatus } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function OrderDetail({ order }: { order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [copied, setCopied] = useState(false);
  const copyText = `Order ${order.id} · ${order.lines.map((l) => `${l.name} x${l.qty}`).join(", ")} · Total ${rs(order.total)} (COD)`;

  return (
    <>
      <PageTitle
        back={{ href: "/admin/orders", label: "All orders" }}
        title={
          <span className="flex items-center gap-3">
            {order.id} <StatusPill status={status} className="font-sans" />
          </span>
        }
        sub={`Placed ${order.createdAt} · via WhatsApp checkout · Cash on Delivery`}
        actions={
          <>
            <label className="flex items-center gap-2 text-sm font-semibold">
              Status
              {/* Phase 2: server action updateOrderStatus(id, status) + timeline entry */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="h-[42px] rounded-[10px] border border-line bg-white px-2.5 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(copyText).then(() => setCopied(true))}
              className={abtnGhost}
            >
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
              {copied ? "Copied" : "Copy order"}
            </button>
            <a href={waLink()} target="_blank" rel="noopener" className={abtnPrimary}>
              <WhatsAppIcon size={18} /> Open chat
            </a>
          </>
        }
      />
      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="Items" pad={false}>
            {order.lines.map((l) => (
              <div key={l.name} className="flex gap-3.5 border-b border-sand px-[18px] py-4">
                <Thumb tone="#F1EBE4" className="h-20 w-16" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <strong className="text-[15px] font-semibold">{l.name}</strong>
                    <span className="text-[15px] font-semibold">{rs(l.unitPrice * l.qty)}</span>
                  </div>
                  <span className="text-[13px] text-cocoa">
                    {l.options} · Qty {l.qty} · {rs(l.unitPrice)} each
                  </span>
                  {l.personal ? <span className="rounded-lg bg-sand-3 px-3 py-2 text-[13px]">{l.personal}</span> : null}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3.5 px-[18px] py-4">
              <Thumb tone="#ECE5DE" className="h-12 w-12" />
              <span className="text-[13px]">
                <strong className="font-semibold">Reference image</strong>
                <br />
                <span className="text-cocoa">invite-card.jpg · uploaded by customer</span>
              </span>
            </div>
          </Card>
          <Card title="Notes">
            <div className="rounded-[10px] bg-sand-3 px-3 py-2.5">
              <span className="text-xs font-semibold text-cocoa">From customer</span>
              <p className="text-sm">{order.notes}</p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Private note
              <textarea defaultValue={order.privateNote} rows={3} className="rounded-[10px] border border-line bg-cream p-3 text-sm font-normal" />
            </label>
          </Card>
          <Card title="Progress photos" action={<span className="text-xs text-cocoa">Shared with customer on WhatsApp</span>}>
            <div className="flex gap-3">
              <Thumb tone="#F1EBE4" className="h-28 w-[88px] rounded-[10px]" />
              <label className="flex h-28 w-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-gold text-xs font-medium hover:bg-sand-3">
                <PlusIcon size={18} />
                Add photo
                <input type="file" accept="image/*" className="sr-only" />
              </label>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-[18px]">
          <Card title="Customer">
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold underline underline-offset-[3px]">{order.customer.name}</span>
              <span>{order.customer.phone} (WhatsApp)</span>
              <span className="mt-2">{order.customer.address}</span>
              <span>{order.customer.city}</span>
              <span className="mt-2 text-xs text-cocoa">2nd order · first ordered Aug 2026</span>
            </div>
          </Card>
          <Card title="Payment">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{rs(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Savings</span>
                <span>− {rs(order.savings)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery · {order.customer.city}</span>
                <span>{rs(order.delivery)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-sand-2 pt-2.5 font-bold">
                <span>To collect (COD)</span>
                <span>{rs(order.total)}</span>
              </div>
            </div>
          </Card>
          <Card title="Timeline">
            <ol className="flex flex-col gap-3">
              {order.timeline.map((t) => (
                <li key={t.label} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-1 h-3 w-3 shrink-0 rounded-full border border-caramel ${t.done ? "bg-caramel" : "bg-white"}`}
                  />
                  <span className="text-sm">
                    <strong className="font-semibold">{t.label}</strong>
                    <br />
                    <span className="text-xs text-cocoa">{t.at}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
