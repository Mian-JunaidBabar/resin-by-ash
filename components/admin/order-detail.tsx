"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { Card, PageTitle, StatusPill, Thumb, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { addProgressPhoto, savePrivateNote, setShipBy, updateOrderStatus } from "@/app/admin/(panel)/orders/actions";
import { rs } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";

type Detail = {
  dbId: string;
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; phone: string; city: string; address: string; orderCount: number };
  lines: { name: string; options: string; personal?: string; referenceImage?: string; qty: number; unitPrice: number; unitWas: number }[];
  notes?: string;
  privateNote: string;
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
  progressPhotos: string[];
  shipBy: string;
  whatsappMessage: string;
  waPhone: string;
  timeline: { label: string; at: string; done: boolean }[];
};

const STATUSES: OrderStatus[] = ["New", "Confirmed", "In progress", "Shipped", "Delivered", "Cancelled"];

export function OrderDetail({ order }: { order: Detail }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(order.privateNote);
  const [noteState, setNoteState] = useState<"idle" | "saving" | "saved">("idle");
  const firstRender = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setNoteState("saving");
    const timer = setTimeout(async () => {
      const fd = new FormData();
      fd.set("id", order.dbId);
      fd.set("privateNote", note);
      await savePrivateNote(fd);
      setNoteState("saved");
    }, 700);
    return () => clearTimeout(timer);
  }, [note, order.dbId]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(order.whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <PageTitle
        back={{ href: "/admin/orders", label: "All orders" }}
        title={
          <span className="flex items-center gap-3">
            {order.id} <StatusPill status={order.status} className="font-sans" />
          </span>
        }
        sub={`Placed ${order.createdAt} · via WhatsApp checkout · Cash on Delivery`}
        actions={
          <>
            <form ref={formRef} action={updateOrderStatus} className="flex items-center gap-2 text-sm font-semibold">
              <input type="hidden" name="id" value={order.dbId} />
              <label className="flex items-center gap-2">
                Status
                <select
                  name="status"
                  defaultValue={order.status}
                  onChange={() => formRef.current?.requestSubmit()}
                  className="h-[42px] rounded-[10px] border border-line bg-white px-2.5 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </form>
            <button type="button" onClick={copyMessage} className={abtnGhost}>
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
              {copied ? "Copied" : "Copy order message"}
            </button>
            <a href={`https://wa.me/${order.waPhone}`} target="_blank" rel="noopener" className={abtnPrimary}>
              <WhatsAppIcon size={18} /> Open chat
            </a>
          </>
        }
      />
      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="Items" pad={false}>
            {order.lines.map((l) => (
              <div key={`${l.name}-${l.options}`} className="flex gap-3.5 border-b border-sand px-[18px] py-4">
                <Thumb tone="#F1EBE4" className="h-20 w-16" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <strong className="text-[15px] font-semibold">{l.name}</strong>
                    <span className="text-[15px] font-semibold">{rs(l.unitPrice * l.qty)}</span>
                  </div>
                  <span className="text-[13px] text-cocoa">
                    {l.options || "Standard"} · Qty {l.qty} · {rs(l.unitPrice)} each
                  </span>
                  {l.personal ? <span className="rounded-lg bg-sand-3 px-3 py-2 text-[13px]">{l.personal}</span> : null}
                  {l.referenceImage ? (
                    <a href={l.referenceImage} target="_blank" rel="noopener" className="relative block h-24 w-20 overflow-hidden rounded-lg border border-sand-2">
                      <Image src={l.referenceImage} alt="Customer reference" fill sizes="80px" className="object-cover" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </Card>
          <Card title="Notes">
            {order.notes ? (
              <div className="rounded-[10px] bg-sand-3 px-3 py-2.5">
                <span className="text-xs font-semibold text-cocoa">From customer</span>
                <p className="text-sm">{order.notes}</p>
              </div>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-semibold">
              <span className="flex items-center justify-between">
                Private note
                <span className="text-xs font-normal text-cocoa" aria-live="polite">
                  {noteState === "saving" ? "Saving…" : noteState === "saved" ? "Saved" : ""}
                </span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="rounded-[10px] border border-line bg-cream p-3 text-sm font-normal"
              />
            </label>
          </Card>
          <Card title="Progress photos" action={<span className="text-xs text-cocoa">Shared with customer on WhatsApp</span>}>
            <div className="flex flex-wrap gap-3">
              {order.progressPhotos.map((url) => (
                <span key={url} className="relative block h-28 w-[88px] overflow-hidden rounded-[10px] border border-sand-2">
                  <Image src={url} alt="Progress photo" fill sizes="88px" className="object-cover" />
                </span>
              ))}
              <form action={addProgressPhoto} encType="multipart/form-data">
                <input type="hidden" name="id" value={order.dbId} />
                <label className="flex h-28 w-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-gold text-xs font-medium hover:bg-sand-3">
                  <PlusIcon size={18} />
                  Add photo
                  <input type="file" name="photo" accept="image/*" required className="sr-only" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
                </label>
              </form>
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
              <span className="mt-2 text-xs text-cocoa">
                {order.customer.orderCount} {order.customer.orderCount === 1 ? "order" : "orders"} with Ash
              </span>
            </div>
          </Card>
          <Card title="Payment">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{rs(order.subtotal + order.savings)}</span>
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
          <Card title="Ship by">
            <form action={setShipBy} className="flex items-end gap-2">
              <input type="hidden" name="id" value={order.dbId} />
              <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-cocoa">
                Date
                <input type="date" name="shipBy" defaultValue={order.shipBy} className="h-[38px] rounded-[10px] border border-line bg-cream px-2 text-sm font-normal text-ink" />
              </label>
              <button type="submit" className={abtnGhost}>
                Save
              </button>
            </form>
          </Card>
          <Card title="Timeline">
            <ol className="flex flex-col gap-3">
              {order.timeline.map((t) => (
                <li key={`${t.label}-${t.at}`} className="flex gap-2.5">
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
