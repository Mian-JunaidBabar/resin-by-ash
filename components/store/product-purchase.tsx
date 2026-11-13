"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { uploadReferenceImage } from "@/app/(store)/actions";
import { BagIcon, CheckIcon, ClockIcon, UploadIcon, WhatsAppIcon } from "@/components/icons";
import { track, trackAddToCart, trackItem } from "@/lib/analytics";
import { cart } from "@/lib/cart";
import { rs, variantPrice } from "@/lib/pricing";
import type { Personalisation, Product } from "@/lib/types";
import { personalisationSummary, waLink } from "@/lib/whatsapp";

const TEXT_COLOURS = ["Gold", "Silver", "Rose gold", "White"];

export function ProductPurchase({ product, whatsappNumber }: { product: Product; whatsappNumber: string }) {
  const sizes = product.sizes ?? [];
  const colours = product.colours ?? [];
  const [sizeI, setSizeI] = useState(sizes.length > 1 ? 1 : 0);
  const [colourI, setColourI] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [per, setPer] = useState<Personalisation>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const ids = { names: useId(), date: useId(), text: useId(), colour: useId(), file: useId() };

  const size = sizes[sizeI];
  const colour = colours[colourI];
  const price = variantPrice(product, size, colour);
  const total = price.price * qty;
  const has = (f: Product["personalisation"][number]) => product.personalisation.includes(f);

  // Fire once when the product page opens, after the visitor's analytics choice.
  useEffect(() => {
    trackItem(product, price.price);
  }, [product, price.price]);

  const set = (k: keyof Personalisation, v: string) => {
    setAdded(false);
    setPer((p) => ({ ...p, [k]: v || undefined }));
  };

  const options = [size?.name, colour?.name].filter(Boolean).join(", ");
  const perText = personalisationSummary(per);
  const msg = [
    `Assalam o Alaikum Ash! I'd like to order: ${product.name}${options ? ` (${options})` : ""}, qty ${qty} (${rs(total)})`,
    perText ? perText : null,
  ]
    .filter(Boolean)
    .join("\n");

  const add = () => {
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: size?.name,
      colour: colour?.name,
      personalisation: per,
      unitPrice: price.price,
      unitWas: price.was ?? price.price,
      qty,
      tone: product.tone,
      image: product.images[0],
    });
    trackAddToCart(product, price.price, qty);
    setAdded(true);
  };

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Price */}
      <div className="flex flex-col gap-1.5 rounded-[14px] bg-sand-3 px-4 py-3.5" aria-live="polite">
        {price.onSale ? (
          <>
            <div className="flex items-center gap-2.5">
              <span className="sr-only">Was</span>
              <s className="text-sm text-muted">{rs(price.was!)}</s>
              <span className="sr-only">now</span>
              <span className="text-2xl font-bold">{rs(price.price)}</span>
              <span className="pill-off !px-2.5 !py-0.5 !text-xs">-{price.off}%</span>
            </div>
            <span className="text-[13px] font-medium">You save {rs(price.save!)} · Cash on Delivery available</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold">{rs(price.price)}</span>
            <span className="text-[13px] font-medium">Cash on Delivery available</span>
          </>
        )}
      </div>

      {sizes.length ? (
        <div role="radiogroup" aria-label="Size" className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold">
            Size: <span className="font-normal">{size?.name}</span>
          </span>
          <div className="flex gap-2">
            {sizes.map((z, n) => (
              <button
                key={z.name}
                type="button"
                role="radio"
                aria-checked={n === sizeI}
                onClick={() => {
                  setSizeI(n);
                  setAdded(false);
                }}
                className="h-11 flex-1 rounded-xl border border-line bg-white text-sm font-medium transition-colors hover:border-brown aria-checked:border-brown aria-checked:bg-brown aria-checked:text-cream"
              >
                {z.name}
                {z.priceDelta ? <span className="sr-only"> (+{rs(z.priceDelta)})</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {colours.length ? (
        <div role="radiogroup" aria-label="Colour" className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold">
            Colour: <span className="font-normal">{colour?.name}</span>
            {colour?.priceDelta ? <span className="font-normal text-cocoa"> (+{rs(colour.priceDelta)})</span> : null}
          </span>
          <div className="flex flex-wrap gap-3">
            {colours.map((c, n) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={n === colourI}
                aria-label={c.name}
                title={c.name}
                onClick={() => {
                  setColourI(n);
                  setAdded(false);
                }}
                className="h-11 w-11 rounded-full border border-line bg-cream p-[3px] transition-transform hover:scale-105 aria-checked:border-brown"
              >
                <span className="block h-full w-full rounded-full" style={{ background: c.swatch }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {product.customisable && product.personalisation.length ? (
        <fieldset className="m-0 flex flex-col gap-4 rounded-2xl border border-sand-2 bg-white px-4 py-[18px]">
          <legend className="px-1.5 text-sm font-semibold">
            Personalise it <span className="font-normal">· free</span>
          </legend>
          {has("names") ? (
            <label htmlFor={ids.names} className="label">
              Names
              <input
                id={ids.names}
                type="text"
                maxLength={40}
                placeholder="e.g. Ayesha & Hamza"
                onChange={(e) => set("names", e.target.value)}
                className="field field-soft font-normal"
              />
            </label>
          ) : null}
          {has("date") ? (
            <label htmlFor={ids.date} className="label">
              Date
              <input id={ids.date} type="date" onChange={(e) => set("date", e.target.value)} className="field field-soft font-normal" />
            </label>
          ) : null}
          {has("text") ? (
            <label htmlFor={ids.text} className="label">
              Short text
              <input
                id={ids.text}
                type="text"
                maxLength={30}
                placeholder="Up to 30 characters"
                onChange={(e) => set("text", e.target.value)}
                className="field field-soft font-normal"
              />
            </label>
          ) : null}
          {has("textColour") ? (
            <label htmlFor={ids.colour} className="label">
              Text colour
              <select id={ids.colour} defaultValue="" onChange={(e) => set("textColour", e.target.value)} className="field field-soft font-normal">
                <option value="">Choose a colour</option>
                {TEXT_COLOURS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          ) : null}
          {has("referenceImage") ? (
            <label
              htmlFor={ids.file}
              className="relative flex cursor-pointer items-center gap-3.5 rounded-xl border border-dashed border-gold p-3.5 transition-colors hover:bg-sand-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-caramel"
            >
              <UploadIcon size={22} />
              <span className="flex flex-col gap-0.5">
                <strong className="text-sm font-semibold">
                  {uploading ? "Uploading photo…" : per.referenceImage ? "Reference photo attached" : "Reference image"}
                </strong>
                <span className="text-[13px]">
                  {uploadError
                    ? uploadError
                    : per.referenceImage
                      ? "We'll attach it to your order"
                      : "Optional · JPG or PNG"}
                </span>
              </span>
              <input
                id={ids.file}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadError("");
                  const form = new FormData();
                  form.set("file", file);
                  const res = await uploadReferenceImage(form);
                  setUploading(false);
                  if (res.ok) set("referenceImage", res.url);
                  else setUploadError(res.error);
                }}
                className="absolute h-px w-px opacity-0"
              />
            </label>
          ) : null}
        </fieldset>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" id="qty-label">
          Quantity
        </span>
        <div role="group" aria-labelledby="qty-label" className="flex items-center rounded-xl border border-line bg-white">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 text-xl">
            −
          </button>
          <span aria-live="polite" className="w-8 text-center text-[15px] font-semibold">
            {qty}
          </span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(10, q + 1))} className="h-11 w-11 text-xl">
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href={waLink(msg, whatsappNumber)}
          target="_blank"
          rel="noopener"
          onClick={() => track("begin_checkout", { currency: "PKR", value: total, item_id: product.id })}
          className="btn btn-primary !h-[54px] !text-base"
        >
          <WhatsAppIcon size={20} />
          Order on WhatsApp · {rs(total)}
        </a>
        {added ? (
          <Link href="/cart" className="btn btn-outline !h-[54px] !bg-sand !text-base">
            <CheckIcon size={18} />
            Added · View cart
          </Link>
        ) : (
          <button type="button" onClick={add} className="btn btn-outline !h-[54px] !text-base">
            <BagIcon size={18} />
            Add to cart
          </button>
        )}
        <div className="flex items-center justify-center gap-2 pt-1 text-[13px]">
          <ClockIcon size={16} />
          Made to order · ready in {product.leadTime}
        </div>
      </div>
    </div>
  );
}
