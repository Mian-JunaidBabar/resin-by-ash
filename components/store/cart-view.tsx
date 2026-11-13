"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { placeOrder } from "@/app/(store)/actions";
import { CloseIcon, GiftIcon, WhatsAppIcon } from "@/components/icons";
import { ArchFrame, ResinArt } from "@/components/ui";
import { cart, saveLastOrder, useCart, useHydrated } from "@/lib/cart";
import { CITIES, deliveryFor } from "@/lib/delivery";
import { rs } from "@/lib/pricing";
import { lineOptions, personalisationSummary } from "@/lib/whatsapp";

export function CartView() {
  const lines = useCart();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState(false);
  const hydrated = useHydrated();
  const id = useId();

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const full = lines.reduce((s, l) => s + l.unitWas * l.qty, 0);
  const paid = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const zone = deliveryFor(city);
  const total = paid + (zone?.charge ?? 0);

  if (!hydrated || placed) {
    return (
      <section className="wrap py-14 text-center lg:py-24" aria-busy="true">
        <p className="font-display text-3xl">{placed ? "Opening WhatsApp…" : "Loading your cart…"}</p>
      </section>
    );
  }

  if (!lines.length) {
    return (
      <section className="wrap flex flex-col items-center gap-4 py-14 text-center lg:py-24">
        <ArchFrame className="h-[200px] w-40" bg="#F1EBE4" inset={8} />
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] font-medium lg:text-6xl">
          Your cart is <em>empty.</em>
        </h1>
        <p className="max-w-sm text-[15px] leading-relaxed">Find a keepsake you love, or tell Ash about a piece made just for you.</p>
        <div className="mt-2 flex w-full max-w-sm flex-col gap-2.5 sm:flex-row">
          <Link href="/shop" className="btn btn-primary flex-1">
            Shop now
          </Link>
          <Link href="/custom" className="btn btn-outline flex-1">
            Make it custom
          </Link>
        </div>
      </section>
    );
  }

  const submit = (form: FormData) => {
    // Honeypot: real customers never fill this hidden field.
    if (String(form.get("website") ?? "").trim()) return;
    // Open the WhatsApp tab inside the click so popup blockers allow it; we point it at wa.me once the order is saved.
    const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;
    start(async () => {
      const res = await placeOrder({
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        city: String(form.get("city") ?? ""),
        address: String(form.get("address") ?? ""),
        notes: String(form.get("notes") ?? ""),
        lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, size: l.size, colour: l.colour, personalisation: l.personalisation })),
      });
      if (!res.ok) {
        tab?.close();
        setErrors(res.errors);
        const first = Object.keys(res.errors)[0];
        document.getElementById(`${id}-${first}`)?.focus();
        return;
      }
      saveLastOrder({
        id: res.orderId,
        name: String(form.get("name") ?? "").split(" ")[0],
        lines: res.lines,
        delivery: res.delivery,
        total: res.total,
        waUrl: res.waUrl,
        message: res.message,
      });
      setPlaced(true);
      if (tab) tab.location.href = res.waUrl;
      else window.location.href = res.waUrl;
      cart.clear();
      router.push(`/thank-you?order=${encodeURIComponent(res.orderId)}`);
    });
  };

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${id}-${k}-err`} className="text-[13px] font-medium text-[#9b3b2f]">
        {errors[k]}
      </span>
    ) : null;
  const fieldProps = (k: string) => ({
    id: `${id}-${k}`,
    name: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
    onInput: () => errors[k] && setErrors((e) => ({ ...e, [k]: "" })),
  });

  return (
    <form action={submit} className="wrap grid gap-0 pb-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:pt-6 lg:pb-20">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute h-px w-px opacity-0" />
      <div>
        <section className="flex flex-col gap-1.5 pt-[22px] pb-1.5">
          <h1 className="enter font-display text-[40px] leading-[1.05] font-medium lg:text-6xl">Your cart</h1>
          <span className="text-sm">
            {count} {count === 1 ? "item" : "items"} · checkout finishes on WhatsApp
          </span>
        </section>

        <section aria-label="Items" className="flex flex-col pt-3">
          {lines.map((l) => {
            const per = personalisationSummary(l.personalisation);
            return (
              <article key={l.key} className="flex gap-3.5 border-b border-sand-2 py-4">
                <Link
                  href={`/product/${l.slug}`}
                  className="relative h-[115px] w-[92px] shrink-0 overflow-hidden rounded-xl lg:h-[140px] lg:w-28"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ResinArt seed={l.slug} tone={l.tone} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex justify-between gap-2">
                    <Link href={`/product/${l.slug}`} className="font-display text-[19px] leading-[1.15] font-semibold no-underline hover:text-caramel lg:text-[22px]">
                      {l.name}
                    </Link>
                    <button
                      type="button"
                      aria-label={`Remove ${l.name}`}
                      onClick={() => cart.remove(l.key)}
                      className="-mt-1.5 -mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-sand"
                    >
                      <CloseIcon size={18} />
                    </button>
                  </div>
                  {lineOptions(l) ? <span className="text-[13px] leading-normal text-cocoa">{lineOptions(l)}</span> : null}
                  {per ? <span className="rounded-lg bg-sand-3 px-2 py-1.5 text-[13px] leading-normal">{per}</span> : null}
                  <div className="mt-1 flex items-center justify-between">
                    <div role="group" aria-label={`Quantity of ${l.name}`} className="flex items-center rounded-[10px] border border-line bg-white">
                      <button type="button" aria-label="Decrease quantity" onClick={() => cart.setQty(l.key, l.qty - 1)} className="h-10 w-10 text-lg">
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => cart.setQty(l.key, l.qty + 1)} className="h-10 w-10 text-lg">
                        +
                      </button>
                    </div>
                    <div className="flex flex-col items-end">
                      {l.unitWas > l.unitPrice ? <s className="text-[13px] text-muted">{rs(l.unitWas * l.qty)}</s> : null}
                      <span className="text-base font-bold">{rs(l.unitPrice * l.qty)}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <fieldset className="m-0 flex flex-col gap-4 border-0 p-0 pt-[30px]" disabled={pending}>
          <legend className="mb-4 font-display text-[28px] leading-[1.1] font-medium">Delivery details</legend>
          <label className="label" htmlFor={`${id}-name`}>
            Full name
            <input {...fieldProps("name")} type="text" autoComplete="name" required className="field font-normal" />
            {err("name")}
          </label>
          <label className="label" htmlFor={`${id}-phone`}>
            WhatsApp number
            <input
              {...fieldProps("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="03XX XXXXXXX"
              required
              className="field font-normal"
            />
            {err("phone")}
          </label>
          <label className="label" htmlFor={`${id}-city`}>
            City
            <select
              {...fieldProps("city")}
              required
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setErrors((x) => ({ ...x, city: "" }));
              }}
              className="field font-normal"
            >
              <option value="" disabled>
                Select your city
              </option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {err("city")}
          </label>
          <label className="label" htmlFor={`${id}-address`}>
            Full address
            <textarea
              {...fieldProps("address")}
              rows={3}
              autoComplete="street-address"
              placeholder="House, street, area, landmark"
              required
              className="field font-normal"
            />
            {err("address")}
          </label>
          <label className="label" htmlFor={`${id}-notes`}>
            <span>
              Notes for Ash <span className="font-normal">· optional</span>
            </span>
            <textarea {...fieldProps("notes")} rows={2} placeholder="Gift wrap, delivery timing, anything else" className="field font-normal" />
          </label>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-[112px] lg:self-start lg:pt-[22px]">
        <section aria-label="Order summary" className="mt-7 flex flex-col gap-3 rounded-2xl bg-sand px-[18px] py-5 lg:mt-0 lg:px-6 lg:py-6">
          <h2 className="mb-0.5 font-display text-2xl font-semibold">Summary</h2>
          <div className="flex justify-between text-[15px]">
            <span>Subtotal</span>
            <span>{rs(full)}</span>
          </div>
          {full > paid ? (
            <div className="flex justify-between text-[15px]">
              <span>You save</span>
              <span>− {rs(full - paid)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-[15px]">
            <span>Delivery{zone ? ` · ${zone.days} days` : ""}</span>
            <span>{zone ? rs(zone.charge) : "Select city"}</span>
          </div>
          <div aria-hidden="true" className="h-px bg-gold/60" />
          <div className="flex items-baseline justify-between">
            <strong className="text-base font-semibold">Total</strong>
            <strong className="text-[22px] font-bold" aria-live="polite">
              {rs(total)}
            </strong>
          </div>
          <div className="flex items-start gap-2.5 rounded-[10px] bg-cream px-3 py-2.5 text-[13px] leading-normal">
            <GiftIcon size={18} className="mt-0.5 shrink-0" />
            Cash on Delivery. Pay when your parcel arrives, anywhere in Pakistan.
          </div>
        </section>
        <div className="flex flex-col gap-2.5 pt-[22px]">
          {errors.lines ? <p className="text-[13px] font-medium text-[#9b3b2f]">{errors.lines}</p> : null}
          <button type="submit" disabled={pending} className="btn btn-primary !h-[58px] !rounded-[14px] !text-[17px] !font-bold">
            <WhatsAppIcon size={22} />
            {pending ? "Saving your order…" : "Place order on WhatsApp"}
          </button>
          <span className="text-center text-[13px] leading-normal">
            We save your order, then open WhatsApp with every detail filled in. Just press send.
          </span>
          <Link href="/shop" className="link-underline self-center py-3 text-sm font-medium">
            Continue shopping
          </Link>
        </div>
      </aside>
    </form>
  );
}
