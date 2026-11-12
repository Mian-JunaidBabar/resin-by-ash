"use client";

import { useId, useState, useSyncExternalStore, useTransition } from "react";
import { submitCustomRequest } from "@/app/(store)/actions";
import { UploadIcon, WhatsAppIcon } from "@/components/icons";
import { TONES } from "@/lib/data/catalog";

const ITEMS = [
  { v: "nikkah", label: "Nikkah tray & pens" },
  { v: "jewellery", label: "Jewellery" },
  { v: "flower-preservation", label: "Flower preservation" },
  { v: "keychains", label: "Keychain" },
  { v: "watches-clocks", label: "Watch or clock" },
  { v: "other", label: "Something else" },
];
const BUDGETS = ["Not sure yet", "Under Rs 2,000", "Rs 2,000–5,000", "Rs 5,000–10,000", "Rs 10,000+"];
const COLOURS = [
  { name: "Ivory", swatch: TONES.ivory },
  { name: "Gold", swatch: TONES.gold },
  { name: "Blush", swatch: TONES.blush },
  { name: "Sage", swatch: TONES.sage },
  { name: "Ocean", swatch: TONES.ocean },
  { name: "Black", swatch: TONES.black },
];

export function CustomForm() {
  const id = useId();
  // Deep links like /custom?item=flower-preservation preselect the item (read client-side to keep the page static).
  const linked = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("item"),
    () => null,
  );
  const [picked, setItem] = useState<string | null>(null);
  const item = picked ?? (linked && ITEMS.some((i) => i.v === linked) ? linked : ITEMS[0].v);
  const [colours, setColours] = useState<string[]>(["Ivory", "Gold"]);
  const [images, setImages] = useState<(string | undefined)[]>([undefined, undefined, undefined]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const submit = (fd: FormData) => {
    const tab = window.open("", "_blank");
    start(async () => {
      const res = await submitCustomRequest({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        item: ITEMS.find((i) => i.v === item)?.label ?? item,
        date: String(fd.get("date") ?? ""),
        budget: String(fd.get("budget") ?? ""),
        description: String(fd.get("description") ?? ""),
        colours,
        images: images.filter(Boolean) as string[],
      });
      if (!res.ok) {
        tab?.close();
        setErrors(res.errors);
        document.getElementById(`${id}-${Object.keys(res.errors)[0]}`)?.focus();
        return;
      }
      if (tab) tab.location.href = res.waUrl;
      else window.location.href = res.waUrl;
      setSent(true);
    });
  };

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${id}-${k}-err`} className="text-[13px] font-medium text-[#9b3b2f]">
        {errors[k]}
      </span>
    ) : null;
  const fp = (k: string) => ({
    id: `${id}-${k}`,
    name: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
    onInput: () => errors[k] && setErrors((e) => ({ ...e, [k]: "" })),
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-gold bg-white px-[18px] py-8 text-center" role="status">
        <h2 className="font-display text-[30px] leading-[1.1] font-medium">
          Sent to <em>Ash.</em>
        </h2>
        <p className="text-[15px] leading-relaxed">
          Your idea opened in WhatsApp. Attach your reference photos there and press send. Ash will reply with a design and quote.
        </p>
        <button type="button" onClick={() => setSent(false)} className="link-underline self-center text-sm font-semibold">
          Start another request
        </button>
      </div>
    );
  }

  return (
    <form
      id="custom-form"
      action={submit}
      className="flex scroll-mt-28 flex-col gap-[18px] rounded-2xl border border-sand-2 bg-white px-[18px] py-6 lg:px-8 lg:py-8"
    >
      <h2 className="font-display text-[30px] leading-[1.1] font-medium">Tell Ash about it</h2>
      <fieldset disabled={pending} className="m-0 flex flex-col gap-[18px] border-0 p-0">
        <div className="grid gap-[18px] lg:grid-cols-2 lg:gap-3">
          <label className="label" htmlFor={`${id}-name`}>
            Your name
            <input {...fp("name")} type="text" autoComplete="name" required className="field field-soft font-normal" />
            {err("name")}
          </label>
          <label className="label" htmlFor={`${id}-phone`}>
            WhatsApp number
            <input
              {...fp("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="03XX XXXXXXX"
              required
              className="field field-soft font-normal"
            />
            {err("phone")}
          </label>
        </div>
        <label className="label" htmlFor={`${id}-item`}>
          What would you like?
          <select id={`${id}-item`} value={item} onChange={(e) => setItem(e.target.value)} className="field field-soft font-normal">
            {ITEMS.map((i) => (
              <option key={i.v} value={i.v}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="label" htmlFor={`${id}-date`}>
            Occasion date
            <input {...fp("date")} type="date" className="field field-soft !px-2.5 !text-sm font-normal" />
          </label>
          <label className="label" htmlFor={`${id}-budget`}>
            Budget
            <select {...fp("budget")} className="field field-soft !px-2.5 !text-sm font-normal">
              {BUDGETS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="label" htmlFor={`${id}-description`}>
          Describe your idea
          <textarea
            {...fp("description")}
            rows={5}
            required
            placeholder="Names, size, flowers, the occasion…"
            className="field field-soft font-normal"
          />
          {err("description")}
        </label>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-semibold">
            Reference images <span className="font-normal">· up to 3</span>
          </legend>
          <div className="grid grid-cols-3 gap-2.5">
            {images.map((img, n) => (
              <label
                key={n}
                className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gold p-2 text-center text-xs transition-colors hover:bg-sand-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-caramel"
              >
                <UploadIcon size={20} />
                <span className="line-clamp-2 break-all">{img ?? `Image ${n + 1}`}</span>
                {/* Phase 2: upload to storage; for now the customer attaches photos in WhatsApp. */}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute h-px w-px opacity-0"
                  onChange={(e) => {
                    const f = e.target.files?.[0]?.name;
                    setImages((arr) => arr.map((x, i) => (i === n ? f : x)));
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-semibold">
            Colours <span className="font-normal">· {colours.length ? colours.join(", ") : "pick any"}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {COLOURS.map((c) => {
              const on = colours.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={on}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColours((s) => (on ? s.filter((x) => x !== c.name) : [...s, c.name]))}
                  className="h-11 w-11 rounded-full border border-line bg-white p-[3px] transition-transform hover:scale-105 aria-pressed:border-brown"
                >
                  <span className="block h-full w-full rounded-full" style={{ background: c.swatch }} />
                </button>
              );
            })}
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary !h-[54px] !text-base">
          <WhatsAppIcon size={20} />
          {pending ? "Preparing your message…" : "Send on WhatsApp"}
        </button>
        <span className="-mt-1.5 text-center text-[13px] leading-normal">
          Your details open in WhatsApp, ready to send. Attach the photos there too. No payment until the design is agreed.
        </span>
      </fieldset>
    </form>
  );
}
