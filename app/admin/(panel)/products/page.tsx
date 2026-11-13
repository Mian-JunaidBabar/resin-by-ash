/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon, SearchIcon, StarIcon } from "@/components/icons";
import { Pill, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { rs } from "@/lib/pricing";
import { archiveProduct, togglePin } from "./actions";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 20;
const STATUS_STYLES = {
  LIVE: "bg-st-done-bg text-st-done-fg",
  DRAFT: "bg-st-progress-bg text-st-progress-fg",
  HIDDEN: "bg-st-off-bg text-st-off-fg",
} as const;

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function ProductsPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading products…</p>}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsContent({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const status = typeof sp.status === "string" && ["LIVE", "DRAFT", "HIDDEN"].includes(sp.status) ? sp.status : "";
  const categorySlug = typeof sp.category === "string" ? sp.category : "";
  const page = Math.max(1, Number(sp.page) || 1);

  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const top = await db.category.findFirst({
      where: { slug: categorySlug, parentId: null },
      include: { children: { select: { id: true } } },
    });
    categoryIds = top ? [top.id, ...top.children.map((c) => c.id)] : [];
  }

  const where = {
    ...(status ? { status: status as "LIVE" | "DRAFT" | "HIDDEN" } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
  };

  const [rows, total, cats, pinned] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { include: { parent: { select: { name: true } } } },
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    db.product.count({ where }),
    db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    db.product.count({ where: { pinnedBestSeller: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const params = (next: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base = { q, status, category: categorySlug, page, ...next };
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== "" && v !== 1) p.set(k, String(v));
    const s = p.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl leading-[1.05] font-semibold">Products</h1>
          <span className="text-sm text-cocoa">
            {total} products · {pinned} pinned as best sellers
          </span>
        </div>
        <Link href="/admin/products/new" className={abtnPrimary}>
          <PlusIcon size={16} /> Add product
        </Link>
      </div>

      <form action="/admin/products" className="flex flex-wrap items-center gap-3">
        <label className="relative block flex-1 sm:max-w-[320px]">
          <span className="sr-only">Search products</span>
          <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
          <input name="q" defaultValue={q} placeholder="Search products" className="h-[42px] w-full rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Category
          <select name="category" defaultValue={categorySlug} className="h-[42px] rounded-[10px] border border-line bg-white px-2.5 text-sm">
            <option value="">All</option>
            {cats.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Status
          <select name="status" defaultValue={status} className="h-[42px] rounded-[10px] border border-line bg-white px-2.5 text-sm">
            <option value="">Any</option>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </label>
        <button type="submit" className={abtnGhost}>
          Filter
        </button>
      </form>

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
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-sand">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {p.images[0] ? (
                      p.images[0].isVideo ? (
                        <span className="flex h-[50px] w-10 items-center justify-center rounded-lg bg-sand text-[10px]">Video</span>
                      ) : (
                          <img src={p.images[0].url} alt="" className="h-[50px] w-10 rounded-lg object-cover" />
                      )
                    ) : (
                      <span className="h-[50px] w-10 rounded-lg" style={{ background: p.toneBg }} />
                    )}
                    <span className="flex flex-col">
                      <Link href={`/admin/products/${p.id}`} className="font-semibold text-brown no-underline hover:text-caramel">
                        {p.name}
                      </Link>
                      <span className="text-xs text-cocoa">/{p.slug}</span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">{p.category.parent ? `${p.category.parent.name} / ${p.category.name}` : p.category.name}</td>
                <td className="px-4 py-2.5">{rs(p.price)}</td>
                <td className="px-4 py-2.5">{p.salePrice ? rs(p.salePrice) : "—"}</td>
                <td className="px-4 py-2.5">
                  <Pill className={STATUS_STYLES[p.status]}>{p.status[0] + p.status.slice(1).toLowerCase()}</Pill>
                </td>
                <td className="px-4 py-2.5">
                  <form action={togglePin}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" aria-label={p.pinnedBestSeller ? `Unpin ${p.name}` : `Pin ${p.name}`} className="flex items-center gap-1 text-xs font-semibold">
                      <StarIcon size={15} className={p.pinnedBestSeller ? "text-caramel" : "text-cocoa"} />
                      {p.pinnedBestSeller ? "Pinned" : "Pin"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    {p.status !== "HIDDEN" ? (
                      <form action={archiveProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-semibold text-cocoa underline">
                          Archive
                        </button>
                      </form>
                    ) : null}
                    <Link href={`/admin/products/${p.id}`} className={`${abtnGhost} !h-8 !px-2.5 !text-xs`}>
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-cocoa">
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={params({ page: page - 1 })} className={abtnGhost}>
              Previous
            </Link>
          ) : null}
          {page < pages ? (
            <Link href={params({ page: page + 1 })} className={abtnGhost}>
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}
