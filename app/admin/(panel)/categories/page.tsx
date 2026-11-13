import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { DragIcon, UploadIcon } from "@/components/icons";
import { Card, PageTitle, Thumb, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { CATEGORIES, PRODUCTS } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Categories" };

/** Phase 2: drag-to-reorder saves sortOrder; "Show on home" toggles showOnHome; both revalidateTag("categories"). */
export default async function CategoriesPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle title="Categories" sub="Drag to set the order they appear in the shop and on the home page." />
      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card pad={false}>
          <ul>
            {CATEGORIES.map((c) => {
              const count = PRODUCTS.filter((p) => p.category === c.slug).length;
              return (
                <li key={c.slug} className="flex items-center gap-3.5 border-b border-sand px-[18px] py-3.5 last:border-0">
                  <span aria-hidden="true" className="cursor-grab text-cocoa">
                    <DragIcon size={18} />
                  </span>
                  <Thumb tone={c.tone} className="h-14 w-11 rounded-t-full rounded-b-md" />
                  <span className="flex flex-1 flex-col">
                    <strong className="text-[15px] font-semibold">{c.name}</strong>
                    <span className="text-xs text-cocoa">
                      /{c.slug} · {count} products
                    </span>
                  </span>
                  <label className="flex items-center gap-2 text-[13px] font-medium">
                    Show on home
                    <input type="checkbox" defaultChecked={c.showOnHome} className="h-5 w-5" />
                  </label>
                  <button type="button" className={`${abtnGhost} !h-9 !text-[13px]`}>
                    Edit
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="New category">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Name
            <input placeholder="e.g. Gift sets" className={afield} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Short description
            <textarea rows={3} className={`${afield} !h-auto py-2.5 font-normal`} />
          </label>
          <label className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-dashed border-gold p-3.5 hover:bg-sand-3">
            <UploadIcon size={22} />
            <span className="text-[13px]">
              <strong className="text-sm font-semibold">Arch tile photo</strong>
              <br />
              4:5, shown in an arch frame
            </span>
            <input type="file" accept="image/*" className="sr-only" />
          </label>
          <button type="button" className={abtnPrimary}>
            Add category
          </button>
        </Card>
      </div>
    </>
  );
}
