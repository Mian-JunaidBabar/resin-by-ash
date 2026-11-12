"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { Card, PageTitle, Toggle, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { OCCASIONS } from "@/lib/data/catalog";
import { priceInfo, rs } from "@/lib/pricing";
import type { Category, PersonalisationField, Product, VariantOption } from "@/lib/types";

const PERSONAL: { key: PersonalisationField; label: string; hint: string }[] = [
  { key: "names", label: "Names", hint: "e.g. Ayesha & Hamza" },
  { key: "date", label: "Date", hint: "Nikkah or event date" },
  { key: "text", label: "Short text", hint: "Up to 30 characters" },
  { key: "textColour", label: "Text colour", hint: "Gold, silver, rose gold, white" },
  { key: "referenceImage", label: "Reference image upload", hint: "Customer can attach one photo" },
];

function Options({ title, values, onAdd }: { title: string; values: VariantOption[]; onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{title}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v.name} className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-cream px-3 text-[13px]">
            {v.swatch ? <span className="h-3.5 w-3.5 rounded-full" style={{ background: v.swatch }} /> : null}
            {v.name}
            {v.priceDelta ? <span className="text-cocoa">+{rs(v.priceDelta)}</span> : null}
          </span>
        ))}
        <button type="button" onClick={onAdd} className="flex h-9 items-center gap-1 rounded-lg border border-dashed border-gold px-3 text-[13px] font-semibold hover:bg-sand-3">
          <PlusIcon size={14} /> Value
        </button>
      </div>
    </div>
  );
}

/** Product create/edit. Phase 2: wire to saveProduct server action (validation rules in docs/phase-2/03-backend-plan.md). */
export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [price, setPrice] = useState(product?.price ?? 0);
  const [sale, setSale] = useState<number | undefined>(product?.salePrice);
  const [sizes, setSizes] = useState(product?.sizes ?? []);
  const [colours, setColours] = useState(product?.colours ?? []);
  const [occasions, setOccasions] = useState<string[]>(product?.occasions ?? []);
  const [saved, setSaved] = useState(false);
  const info = priceInfo(price, sale);
  const saleInvalid = sale != null && sale > 0 && sale >= price;
  const bigDiscount = info.onSale && (info.off ?? 0) > 50;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!saleInvalid) setSaved(true);
      }}
      className="flex flex-col gap-6"
    >
      <PageTitle
        back={{ href: "/admin/products", label: "All products" }}
        title={product?.name ?? "New product"}
        actions={
          <>
            {product ? (
              <Link href={`/product/${product.slug}`} target="_blank" className={abtnGhost}>
                Preview
              </Link>
            ) : null}
            <button type="submit" className={abtnPrimary}>
              {saved ? "Saved" : "Save changes"}
            </button>
          </>
        }
      />
      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="Basics">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Name
              <input name="name" defaultValue={product?.name} required className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Category
              <select name="category" defaultValue={product?.category} className={afield}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Description
              <textarea name="description" defaultValue={product?.description} rows={4} className={`${afield} !h-auto py-2.5 font-normal`} />
            </label>
          </Card>

          <Card title="Photos & video" action={<span className="text-xs text-cocoa">4:5 photos, first one is the cover. Drag to reorder.</span>}>
            <div className="flex flex-wrap gap-2.5">
              {["Cover", "2", "Video", "4", "5"].map((t, i) => (
                <span
                  key={t}
                  className="relative flex h-[130px] w-[104px] items-end rounded-[10px] p-2 text-[11px] font-semibold"
                  style={{ background: i % 2 ? "#ECE5DE" : "#F1EBE4" }}
                >
                  <span className="rounded-full bg-cream px-2 py-0.5">{t}</span>
                </span>
              ))}
              <label className="flex h-[130px] w-[104px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-gold text-[13px] font-semibold hover:bg-sand-3">
                <PlusIcon size={18} />
                Upload
                <input type="file" accept="image/*,video/mp4" multiple className="sr-only" />
              </label>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Price (Rs)
                <input type="number" min={0} step={50} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Sale price (Rs)
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={sale ?? ""}
                  onChange={(e) => setSale(e.target.value ? Number(e.target.value) : undefined)}
                  aria-invalid={saleInvalid || undefined}
                  className={`${afield} aria-invalid:border-[#9b3b2f]`}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Sale ends
                <input type="date" defaultValue={product?.saleEndsAt} className={afield} />
              </label>
            </div>
            {saleInvalid ? (
              <p className="text-[13px] font-medium text-[#9b3b2f]">Sale price must be lower than the regular price.</p>
            ) : null}
            {bigDiscount ? <p className="text-[13px] font-medium text-st-new-fg">Heads up: that&apos;s more than 50% off.</p> : null}
            <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-sand-3 px-3 py-2.5 text-[13px]">
              Shows on site as
              {info.onSale ? (
                <>
                  <s className="text-muted">{rs(info.was!)}</s>
                  <strong className="text-base">{rs(info.price)}</strong>
                  <span className="pill-off">-{info.off}%</span>
                  <span>· You save {rs(info.save!)}</span>
                </>
              ) : (
                <strong className="text-base">{rs(info.price)}</strong>
              )}
            </div>
          </Card>

          <Card
            title="Variants"
            action={
              <button type="button" className={`${abtnGhost} !h-9 !text-[13px]`}>
                <PlusIcon size={14} /> Add option
              </button>
            }
          >
            <Options title="Size" values={sizes} onAdd={() => setSizes((s) => [...s, { name: `Size ${s.length + 1}` }])} />
            <Options title="Colour" values={colours} onAdd={() => setColours((s) => [...s, { name: `Colour ${s.length + 1}`, swatch: "#E2D8CE" }])} />
          </Card>

          <Card title="Personalisation fields">
            <div className="flex flex-col divide-y divide-sand">
              {PERSONAL.map((f) => (
                <Toggle key={f.key} label={f.label} hint={f.hint} name={`personal-${f.key}`} defaultChecked={product?.personalisation.includes(f.key)} />
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Card title="Visibility">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Status
              <select name="status" defaultValue={product?.status ?? "draft"} className={afield}>
                <option value="live">Live</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <Toggle label="Pin as best seller" hint="Shows on home with the Best seller tag" defaultChecked={product?.pinnedBestSeller} />
            <Toggle label="Show in Latest arrivals" defaultChecked={product?.showInLatest} />
          </Card>
          <Card title="Making">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Lead time shown to customers
              <input name="leadTime" defaultValue={product?.leadTime ?? "5–7 working days"} className={afield} />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Occasions</span>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((o) => {
                  const on = occasions.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setOccasions((s) => (on ? s.filter((x) => x !== o) : [...s, o]))}
                      className={`h-8 rounded-full px-3 text-[13px] font-medium transition-colors ${
                        on ? "bg-sand-2 text-brown" : "border border-dashed border-gold text-cocoa"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
          {product ? (
            <button type="button" className={`${abtnGhost} w-full`}>
              Archive product
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
