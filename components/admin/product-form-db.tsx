/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Card, PageTitle, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { OCCASIONS } from "@/lib/data/catalog";
import { saveProduct } from "@/app/admin/(panel)/products/actions";
import { rs } from "@/lib/pricing";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  details: string;
  care: string;
  price: number;
  salePrice: number | null;
  saleEndsAt: Date | null;
  status: "LIVE" | "DRAFT" | "HIDDEN";
  leadTime: string;
  toneBg: string;
  toneAccent: string;
  customisable: boolean;
  personalisation: string[];
  occasions: string[];
  pinnedBestSeller: boolean;
  pinOrder: number | null;
  showInLatest: boolean;
  images: { id: string; url: string; alt: string | null; position: number; isVideo: boolean }[];
  variants: { kind: string; name: string; priceDelta: number; swatch: string | null }[];
};

const ERRORS: Record<string, string> = {
  invalid: "Check the required fields.",
  sale: "The sale price must be lower than the regular price.",
  "sale-date": "Choose a sale end date today or later.",
  slug: "That slug is already used by another product.",
  category: "Choose a category.",
  upload: "The photo or video could not be uploaded.",
  variant: "Check the variant prices (0 or more) and colour swatches.",
};

const PERSONALISATION = ["names", "date", "text", "textColour", "referenceImage"];
const inputDate = (value: Date | null) =>
  value ? value.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }) : "";

export function ProductForm({
  product,
  categories,
  saved,
  error,
  message,
}: {
  product?: ProductRow;
  categories: { id: string; name: string; depth: number }[];
  saved?: boolean;
  error?: string;
  message?: string;
}) {
  const variants = product?.variants ?? [];
  const variantRows = Array.from({ length: Math.max(6, variants.length) }, (_, i) => variants[i]);

  return (
    <>
      <PageTitle
        back={{ href: "/admin/products", label: "All products" }}
        eyebrow={product ? `/${product.slug}` : "New product"}
        title={product ? product.name : "New product"}
        actions={
          <>
            {product ? (
              <Link href={`/product/${product.slug}`} target="_blank" className={abtnGhost}>
                Preview
              </Link>
            ) : null}
            <button type="submit" form="product-form" className={abtnPrimary}>
              {saved ? "Saved" : "Save product"}
            </button>
          </>
        }
      />

      {saved ? <p className="rounded-lg bg-green-50 px-3 py-2 text-[13px] font-medium text-green-800">Product saved. The shop has been refreshed.</p> : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
          {ERRORS[error] ?? message ?? "Something went wrong."}
        </p>
      ) : null}

      <form id="product-form" action={saveProduct} className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <input type="hidden" name="id" value={product?.id ?? ""} />
        <input type="hidden" name="originalSlug" value={product?.slug ?? ""} />
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="Basics">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Name
                <input name="name" required minLength={2} maxLength={80} defaultValue={product?.name} className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Slug
                <input name="slug" maxLength={80} defaultValue={product?.slug} placeholder="auto from name" className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold sm:col-span-2">
                Category
                <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className={afield}>
                  <option value="">Choose a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.depth ? "— " : ""}
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Description
              <textarea name="description" rows={4} defaultValue={product?.description} className={`${afield} !h-auto py-2.5 font-normal`} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Details
              <textarea name="details" rows={3} defaultValue={product?.details} className={`${afield} !h-auto py-2.5 font-normal`} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Care
              <textarea name="care" rows={2} defaultValue={product?.care} className={`${afield} !h-auto py-2.5 font-normal`} />
            </label>
          </Card>

          <Card title="Photos & video" action={<span className="text-xs text-cocoa">4:5 photos · first is the cover</span>}>
            <div className="flex flex-wrap gap-2.5">
              {product?.images.map((img) => (
                <div key={img.id} className="flex w-[120px] flex-col gap-1.5 rounded-lg border border-sand-2 p-2">
                  {img.isVideo ? (
                    <span className="flex h-[120px] items-center justify-center rounded bg-sand text-xs">Video</span>
                  ) : (
                          <img src={img.url} alt={img.alt ?? ""} className="h-[120px] w-full rounded object-cover" />
                  )}
                  <input type="hidden" name="imageId" value={img.id} />
                  <input name={`imageAlt_${img.id}`} defaultValue={img.alt ?? ""} placeholder="Alt text" className={`${afield} !h-8 !text-xs`} aria-label="Alt text" />
                  <input name={`imageOrder_${img.id}`} type="number" defaultValue={img.position} className={`${afield} !h-8 !text-xs`} aria-label="Order" />
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" name={`imageRemove_${img.id}`} className="h-4 w-4" /> Remove
                  </label>
                </div>
              ))}
              <label className="flex h-[180px] w-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gold text-center text-[13px] font-semibold hover:bg-sand-3">
                Add photos
                <span className="text-[11px] font-normal text-cocoa">JPG, PNG, WebP, HEIC · 8MB</span>
                <input type="file" name="photos" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only" />
              </label>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold">
              Add a video (MP4, up to 20MB)
              <input type="file" name="video" accept="video/mp4" className="text-xs" />
            </label>
          </Card>

          <Card title="Variants">
            <div className="flex flex-col gap-2">
              {variantRows.map((v, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[100px_1fr_110px_110px]">
                  <select name="variantKind" defaultValue={v?.kind ?? "size"} className={afield} aria-label="Variant kind">
                    <option value="size">Size</option>
                    <option value="colour">Colour</option>
                  </select>
                  <input name="variantName" defaultValue={v?.name ?? ""} placeholder={`Option ${i + 1}`} className={afield} aria-label="Variant name" />
                  <input name="variantDelta" type="number" min={0} defaultValue={v?.priceDelta ?? 0} className={afield} aria-label="Price change" />
                  <input name="variantSwatch" type="color" defaultValue={v?.swatch ?? "#E9B8BE"} className="h-11 w-full rounded-[10px] border border-line bg-cream px-1" aria-label="Colour swatch" />
                </div>
              ))}
            </div>
            <p className="text-xs text-cocoa">Price changes add to the regular and sale price. Blank names are ignored.</p>
          </Card>

          <Card title="Personalisation & occasions">
            <div className="flex flex-wrap gap-3">
              {OCCASIONS.map((o) => (
                <label key={o} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="occasions" value={o} defaultChecked={product?.occasions.includes(o)} className="h-4 w-4" />
                  {o}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-sand-2 pt-3">
              {PERSONALISATION.map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="personalisation" value={key} defaultChecked={product?.personalisation.includes(key)} className="h-4 w-4" />
                  {key}
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Card title="Pricing">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Price (Rs)
              <input name="price" type="number" min={1} required defaultValue={product?.price ?? ""} className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Sale price (Rs)
              <input name="salePrice" type="number" min={1} defaultValue={product?.salePrice ?? ""} className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Sale ends
              <input name="saleEndsAt" type="date" defaultValue={inputDate(product?.saleEndsAt ?? null)} className={afield} />
            </label>
            {product ? <p className="text-xs text-cocoa">Current: {rs(product.salePrice ?? product.price)}</p> : null}
          </Card>

          <Card title="Publishing">
            <label className="flex items-center justify-between gap-3 text-sm font-semibold">
              Status
              <select name="status" defaultValue={product?.status ?? "DRAFT"} className={`${afield} !w-auto`}>
                <option value="LIVE">Live</option>
                <option value="DRAFT">Draft</option>
                <option value="HIDDEN">Hidden / archived</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Lead time
              <input name="leadTime" defaultValue={product?.leadTime ?? "5–7 working days"} className={afield} />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="customisable" defaultChecked={product?.customisable} className="h-5 w-5" />
              Customisable
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="showInLatest" defaultChecked={product?.showInLatest} className="h-5 w-5" />
              Show in latest arrivals
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="pinnedBestSeller" defaultChecked={product?.pinnedBestSeller} className="h-5 w-5" />
              Pin as best seller
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Pin order
              <input name="pinOrder" type="number" min={0} defaultValue={product?.pinOrder ?? ""} className={afield} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold">
                Base tone
                <input name="toneBg" type="color" defaultValue={product?.toneBg ?? "#F1EBE4"} className="h-10 w-full rounded border border-line bg-cream px-1" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold">
                Accent
                <input name="toneAccent" type="color" defaultValue={product?.toneAccent ?? "#E9B8BE"} className="h-10 w-full rounded border border-line bg-cream px-1" />
              </label>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
