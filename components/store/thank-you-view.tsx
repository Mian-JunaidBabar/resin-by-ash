"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, CopyIcon, WhatsAppIcon } from "@/components/icons";
import { ArchFrame } from "@/components/ui";
import { useHydrated, useLastOrder } from "@/lib/cart";
import { rs } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";

export function ThankYouView() {
  const hydrated = useHydrated();
  const order = useLastOrder();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (hydrated && !order) {
    return (
      <section className="wrap flex flex-col items-center gap-4 py-14 text-center">
        <h1 className="font-display text-[40px] leading-[1.05] font-medium">No recent order here</h1>
        <p className="max-w-sm text-[15px] leading-relaxed">
          If you placed an order, it&apos;s saved and Ash will confirm it on WhatsApp. You can message her any time.
        </p>
        <div className="flex gap-2.5">
          <a href={waLink()} target="_blank" rel="noopener" className="btn btn-primary">
            <WhatsAppIcon size={20} /> Message Ash
          </a>
          <Link href="/shop" className="btn btn-outline">
            Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <section className="flex flex-col items-center gap-4 px-5 pt-10 pb-7 text-center lg:pt-16">
        <ArchFrame className="enter h-[140px] w-[120px]" bg="#F1EBE4" inset={7}>
          <span className="absolute inset-0 flex items-center justify-center text-caramel">
            <CheckIcon size={40} strokeWidth={1.4} />
          </span>
        </ArchFrame>
        <h1 className="enter mt-1.5 font-display text-[40px] leading-[1.05] font-medium lg:text-6xl" style={{ ["--d" as string]: "80ms" }}>
          Thank you{order?.name ? ", " : ""}
          {order?.name ? <em>{order.name}!</em> : "!"}
        </h1>
        <p className="enter max-w-[320px] text-[15px] leading-relaxed" style={{ ["--d" as string]: "160ms" }}>
          Your order is saved and WhatsApp opened with the details. Ash will confirm there shortly.
        </p>
        <div className="enter flex flex-col items-center gap-1 rounded-[14px] border border-gold bg-white px-[22px] py-3.5" style={{ ["--d" as string]: "240ms" }}>
          <span className="eyebrow">Order ID</span>
          <strong className="text-2xl font-bold tracking-[0.04em]">{order?.id ?? "…"}</strong>
        </div>
      </section>

      <section className="flex flex-col gap-2.5 px-5">
        <a href={order?.waUrl ?? waLink()} target="_blank" rel="noopener" className="btn btn-primary !h-[54px] !text-base">
          <WhatsAppIcon size={20} />
          Open WhatsApp again
        </a>
        <button type="button" onClick={copy} className={`btn btn-outline !h-[54px] !text-base ${copied ? "!bg-sand" : ""}`}>
          {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          <span aria-live="polite">{copied ? "Copied" : "Copy order"}</span>
        </button>
        <span className="text-center text-[13px] leading-normal">
          Message didn&apos;t send? Tap Copy order and paste it into the chat with Ash.
        </span>
      </section>

      {order ? (
        <section aria-label="Order summary" className="mx-5 mt-7 flex flex-col gap-2.5 rounded-2xl bg-sand p-[18px] text-sm">
          {order.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span>
                {l.name} × {l.qty}
              </span>
              <span className="font-semibold">{rs(l.total)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <span>Delivery</span>
            <span className="font-semibold">{rs(order.delivery)}</span>
          </div>
          <div aria-hidden="true" className="h-px bg-gold/60" />
          <div className="flex justify-between">
            <strong className="font-semibold">Total · Cash on Delivery</strong>
            <strong className="text-[17px]">{rs(order.total)}</strong>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3.5 px-5 pt-7 pb-14">
        <h2 className="font-display text-[26px] font-medium">What happens next</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-[18px] text-sm leading-[1.55]">
          <li>Ash confirms your order and personalisation on WhatsApp.</li>
          <li>You get a progress photo before it&apos;s finished.</li>
          <li>Your parcel is sent. Pay cash when it arrives.</li>
        </ol>
        <Link href="/shop" className="link-underline self-start py-3 text-sm font-semibold">
          Continue shopping
        </Link>
      </section>
    </div>
  );
}
