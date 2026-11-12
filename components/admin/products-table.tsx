"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon, StarIcon } from "@/components/icons";
import { Pill, Thumb, abtnPrimary } from "@/components/admin/ui";
import { rs } from "@/lib/pricing";
import type { Product } from "@/lib/types";

const ST: Record<Product["status"], string> = {
  live: "bg-st-done-bg text-st-done-fg",
  draft: "bg-st-progress-bg text-st-progress-fg",
  hidden: "bg-st-off-bg text-st-off-fg",
};
const label = (s: Product["status"]) => s[0].toUpperCase() + s.slice(1);

export function ProductsTable({ products, categories }: { products: Product[]; categories: { slug: string; name: string }[] }) {
  const [pins, setPins] = useState(() => new Set(products.filter((p) => p.pinnedBestSeller).map((p) => p.id)));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!cat || p.category === cat) && (!status || p.status === status),
      ),
    [products, q, cat, status],
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl leading-[1.05] font-semibold">Products</h1>
          <span className="text-sm text-cocoa">
            {products.length} products · {pins.size} pinned as best sellers
          </span>
        </div>
        <Link href="/admin/products/new" className={abtnPrimary}>
          <PlusIcon size={16} /> Add product
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block flex-1 sm:max-w-[320px]">
          <span className="sr-only">Search products</span>
          <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="h-[42px] w-full rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Category
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-[42px] rounded-[10px] border border-line bg-white px-2.5 text-sm">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-[42px] rounded-[10px] border border-line bg-white px-2.5 text-sm">
            <option value="">Any</option>
            <option value="live">Live</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-sand-2 bg-white">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="text-cocoa">
            <tr>
              {["Product", "Category", "Price", "Sale", "Status", "Best seller", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold">
                  {h || <span className="sr-only">Edit</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const on = pins.has(p.id);
              const meta = [
                p.sizes?.length ? `${p.sizes.length} sizes` : null,
                p.colours?.length ? `${p.colours.length} colours` : null,
                p.customisable ? "customisable" : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={p.id} className="border-t border-sand transition-colors hover:bg-sand-3">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <Thumb tone={p.tone[0]} />
                      <span className="flex flex-col">
                        <strong className="text-sm font-semibold">{p.name}</strong>
                        <span className="text-xs text-cocoa">{meta || "—"}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">{catName[p.category]}</td>
                  <td className="px-4 py-3 font-semibold">{rs(p.price)}</td>
                  <td className="px-4 py-3">{p.salePrice ? `${rs(p.salePrice)}${p.saleEndsAt ? ` to ${p.saleEndsAt.slice(5)}` : ""}` : "—"}</td>
                  <td className="px-4 py-3">
                    <Pill className={ST[p.status]}>{label(p.status)}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    {/* Phase 2: server action togglePin(productId) + revalidateTag("products") */}
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`${on ? "Unpin" : "Pin"} ${p.name} as best seller`}
                      onClick={() =>
                        setPins((s) => {
                          const n = new Set(s);
                          if (n.has(p.id)) n.delete(p.id);
                          else n.add(p.id);
                          return n;
                        })
                      }
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        on ? "border-caramel bg-caramel text-white" : "border-line bg-white hover:border-brown"
                      }`}
                    >
                      <StarIcon size={16} filled={on} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold underline underline-offset-[3px]">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
