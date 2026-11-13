/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DragIcon, PlusIcon, UploadIcon } from "@/components/icons";
import { PageTitle, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { ToggleForm } from "@/components/admin/toggle-form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { moveCategory, toggleCategory } from "./actions";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading categories…</p>}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  await requireAdmin();
  const [tops, counts] = await Promise.all([
    db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { children: { orderBy: { sortOrder: "asc" } } },
    }),
    db.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);
  const countFor = (id: string) => counts.find((c) => c.categoryId === id)?._count._all ?? 0;

  return (
    <>
      <PageTitle
        title="Categories"
        sub="Order, visibility and SEO for every shop category."
        actions={
          <Link href="/admin/categories/new" className={abtnPrimary}>
            <PlusIcon size={16} /> New category
          </Link>
        }
      />

      <div className="overflow-hidden rounded-[14px] border border-sand-2 bg-white">
        <ul>
          {tops.map((top) => {
            const topCount = countFor(top.id) + top.children.reduce((sum, child) => sum + countFor(child.id), 0);
            return (
              <li key={top.id} className="border-b border-sand last:border-0">
                <CategoryRow
                  id={top.id}
                  name={top.name}
                  slug={top.slug}
                  imageUrl={top.imageUrl}
                  tone={top.tone}
                  count={topCount}
                  status={top.status}
                  showOnHome={top.showOnHome}
                />
                {top.children.map((child) => (
                  <div key={child.id} className="border-t border-sand bg-cream/40 pl-10">
                    <CategoryRow
                      id={child.id}
                      name={child.name}
                      slug={child.slug}
                      imageUrl={child.imageUrl}
                      tone={child.tone}
                      count={countFor(child.id)}
                      status={child.status}
                      showOnHome={child.showOnHome}
                      child
                    />
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="flex items-center gap-2 text-xs text-cocoa">
        <UploadIcon size={14} /> New categories appear in the shop on the first visit after saving.
      </p>
    </>
  );
}

function CategoryRow({
  id,
  name,
  slug,
  imageUrl,
  tone,
  count,
  status,
  showOnHome,
  child = false,
}: {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  tone: string;
  count: number;
  status: "LIVE" | "HIDDEN";
  showOnHome: boolean;
  child?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-3.5">
      <span aria-hidden="true" className="hidden cursor-grab text-cocoa sm:block">
        <DragIcon size={18} />
      </span>
      {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-14 w-11 rounded-t-full rounded-b-md object-cover" />
      ) : (
        <span aria-hidden="true" className="h-14 w-11 rounded-t-full rounded-b-md" style={{ background: tone }} />
      )}
      <span className="flex min-w-[160px] flex-1 flex-col">
        <strong className="text-[15px] font-semibold">
          {child ? "↳ " : ""}
          {name}
        </strong>
        <span className="text-xs text-cocoa">
          /{slug} · {count} products · {status.toLowerCase()}
        </span>
      </span>
      <ToggleForm action={toggleCategory} id={id} field="showOnHome" checked={showOnHome} label="Show on home" />
      <ToggleForm action={toggleCategory} id={id} field="status" checked={status === "LIVE"} label="Live" />
      <div className="flex gap-1">
        <form action={moveCategory}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value="up" />
          <button type="submit" aria-label={`Move ${name} up`} className={`${abtnGhost} !h-9 !px-2`}>
            ↑
          </button>
        </form>
        <form action={moveCategory}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value="down" />
          <button type="submit" aria-label={`Move ${name} down`} className={`${abtnGhost} !h-9 !px-2`}>
            ↓
          </button>
        </form>
        <Link href={`/admin/categories/${id}`} className={`${abtnGhost} !h-9 !text-[13px]`}>
          Edit
        </Link>
      </div>
    </div>
  );
}
