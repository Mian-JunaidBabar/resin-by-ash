"use client";

import Link from "next/link";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Pill, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { CUSTOM_REQUESTS, REQUEST_STYLES } from "@/lib/data/admin";
import { waLink } from "@/lib/whatsapp";

export function RequestsInbox() {
  const [sel, setSel] = useState(0);
  const cur = CUSTOM_REQUESTS[sel];
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl leading-[1.05] font-semibold">Custom requests</h1>
        <span className="text-sm text-cocoa">From the Custom order form. Each one also landed in WhatsApp.</span>
      </div>
      <div className="grid items-start gap-[18px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <section aria-label="Inbox" className="flex flex-col overflow-hidden rounded-[14px] border border-sand-2 bg-white">
          {CUSTOM_REQUESTS.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSel(i)}
              aria-current={i === sel}
              className={`flex flex-col gap-1 border-b border-l-[3px] border-b-sand px-4 py-3.5 text-left transition-colors last:border-b-0 ${
                i === sel ? "border-l-caramel bg-sand-3" : "border-l-transparent hover:bg-sand-3/60"
              }`}
            >
              <span className="flex justify-between gap-2">
                <strong className="text-sm font-semibold">{r.name}</strong>
                <span className="text-xs text-cocoa">{r.age}</span>
              </span>
              <span className="text-[13px]">
                {r.item} · {r.budget}
              </span>
              <Pill className={`w-fit ${REQUEST_STYLES[r.status]}`}>{r.status}</Pill>
            </button>
          ))}
        </section>
        <section className="flex flex-col gap-5 rounded-[14px] border border-sand-2 bg-white p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-cocoa">
                Request #{cur.id} · received {cur.received}
              </span>
              <h2 className="font-display text-3xl font-semibold">{cur.name}</h2>
              <span className="text-sm">
                {cur.phone} · {cur.city}
              </span>
            </div>
            <a href={waLink()} target="_blank" rel="noopener" className={abtnPrimary}>
              <WhatsAppIcon size={18} /> Reply on WhatsApp
            </a>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Item", cur.item],
              ["Occasion date", cur.date],
              ["Budget", cur.budget],
              ["Colours", cur.colours],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="text-xs font-semibold text-cocoa">{k}</dt>
                <dd className="text-[15px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-cocoa">Their idea</span>
            <p className="text-[15px] leading-relaxed">{cur.description}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-cocoa">Reference images</span>
            <div className="flex gap-2.5">
              {["#F1EBE4", "#ECE5DE", "#F6F2ED"].map((t) => (
                <span key={t} aria-hidden="true" className="h-24 w-[76px] rounded-[10px]" style={{ background: t }} />
              ))}
            </div>
          </div>
          {/* Phase 2: sendQuote(requestId, amount, readyBy) saves + opens WhatsApp with the quote text */}
          <div className="flex flex-wrap items-end gap-3 border-t border-sand-2 pt-5">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Quote (Rs)
              <input inputMode="numeric" placeholder="e.g. 7,500" className={`${afield} w-40`} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Ready by
              <input type="date" className={`${afield} w-44`} />
            </label>
            <button type="button" className={abtnPrimary}>
              Send quote
            </button>
            <Link href="/admin/orders/RBA-1042" className={abtnGhost}>
              Convert to order
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
