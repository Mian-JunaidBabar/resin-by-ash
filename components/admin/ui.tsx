import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_STYLES } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export function Card({ title, action, children, className = "", pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-[14px] border border-sand-2 bg-white ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-sand-2 px-[18px] py-4">
          <h2 className="text-base font-bold">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={pad ? "flex flex-col gap-3.5 p-[18px]" : ""}>{children}</div>
    </section>
  );
}

export function StatusPill({ status, className = "" }: { status: OrderStatus; className?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]} ${className}`}>
      {status}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

export function PageTitle({ title, sub, eyebrow, actions, back }: { title: ReactNode; sub?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-3">
      {back ? (
        <Link href={back.href} className="flex w-fit items-center gap-1.5 text-sm font-semibold no-underline hover:text-caramel">
          <span aria-hidden="true">‹</span> {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {eyebrow ? <span className="text-[13px] text-cocoa">{eyebrow}</span> : null}
          <h1 className="font-display text-4xl leading-[1.05] font-semibold">{title}</h1>
          {sub ? <span className="text-sm text-cocoa">{sub}</span> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}

export const abtn =
  "inline-flex h-[42px] items-center justify-center gap-1.5 rounded-[10px] px-4 text-sm font-semibold no-underline transition-colors cursor-pointer";
export const abtnPrimary = `${abtn} bg-caramel text-white hover:bg-caramel-dark hover:text-white`;
export const abtnGhost = `${abtn} border border-line bg-white hover:border-brown`;
export const abtnChat = "inline-flex h-[34px] items-center rounded-lg border border-caramel px-3 text-[13px] font-semibold whitespace-nowrap text-caramel no-underline transition-colors hover:bg-caramel hover:text-white";
export const afield = "h-11 w-full rounded-[10px] border border-line bg-cream px-3 text-sm text-brown";

export function Toggle({ label, hint, defaultChecked, name }: { label: string; hint?: string; defaultChecked?: boolean; name?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
      <span className="flex flex-col">
        <strong className="text-sm font-semibold">{label}</strong>
        {hint ? <span className="text-xs text-cocoa">{hint}</span> : null}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 shrink-0" />
    </label>
  );
}

export function Thumb({ tone, className = "h-[50px] w-10" }: { tone: string; className?: string }) {
  return <span aria-hidden="true" className={`block shrink-0 rounded-lg ${className}`} style={{ background: tone }} />;
}
