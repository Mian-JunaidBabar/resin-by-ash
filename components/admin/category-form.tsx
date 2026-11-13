/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SeoFields } from "@/components/admin/seo-fields";
import { Card, PageTitle, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { deleteCategory, saveCategory } from "@/app/admin/(panel)/categories/actions";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  shortName: string;
  h1: string | null;
  intro: string;
  metaTitle: string | null;
  metaDescription: string | null;
  seoContent: string | null;
  faq: unknown;
  imageUrl: string | null;
  ogImageUrl: string | null;
  tone: string;
  status: "LIVE" | "HIDDEN";
  sortOrder: number;
  showOnHome: boolean;
  showInFooter: boolean;
};

const ERRORS: Record<string, string> = {
  invalid: "Check the required fields.",
  slug: "That slug is already used under this parent.",
  parent: "Choose a valid top-level parent.",
  upload: "The photo could not be uploaded.",
  inuse: "This category still has products. Move them first.",
  children: "Move or delete the child categories first.",
};

export function CategoryForm({
  category,
  parents,
  moveTargets,
  productCount,
  childCount,
  saved,
  error,
  message,
}: {
  category?: CategoryRow;
  parents: { id: string; name: string }[];
  moveTargets: { id: string; name: string }[];
  productCount: number;
  childCount: number;
  saved?: boolean;
  error?: string;
  message?: string;
}) {
  const faq = Array.isArray(category?.faq) ? (category.faq as { q: string; a: string }[]) : [];

  return (
    <>
      <PageTitle
        back={{ href: "/admin/categories", label: "All categories" }}
        eyebrow={category ? `/${category.slug}` : "New category"}
        title={category ? category.name : "New category"}
        actions={
          <>
            {category ? (
              <Link href={`/shop/${category.slug}`} target="_blank" className={abtnGhost}>
                Preview
              </Link>
            ) : null}
            <button type="submit" form="category-form" className={abtnPrimary}>
              {saved ? "Saved" : "Save category"}
            </button>
          </>
        }
      />

      {saved ? <p className="rounded-lg bg-green-50 px-3 py-2 text-[13px] font-medium text-green-800">Category saved. The shop has been refreshed.</p> : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
          {ERRORS[error] ?? message ?? "Something went wrong."}
        </p>
      ) : null}

      <form id="category-form" action={saveCategory} className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="Basics">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Name
                <input id="category-name" name="name" required maxLength={80} defaultValue={category?.name} className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Short name (chips)
                <input name="shortName" required maxLength={40} defaultValue={category?.shortName} className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Slug
                <input name="slug" maxLength={80} defaultValue={category?.slug} placeholder="auto from name" className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Parent
                <select name="parentId" defaultValue={category?.parentId ?? ""} className={afield}>
                  <option value="">None — top level</option>
                  {parents
                    .filter((p) => p.id !== category?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                H1 heading
                <input name="h1" maxLength={120} defaultValue={category?.h1 ?? ""} placeholder="Defaults to short name" className={afield} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Sort order
                <input name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} className={afield} />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Intro line
              <textarea name="intro" rows={3} defaultValue={category?.intro} className={`${afield} !h-auto py-2.5 font-normal`} />
            </label>
          </Card>

          <Card title="SEO">
            <SeoFields title={category?.metaTitle} description={category?.metaDescription} name={category?.shortName} path={category ? `shop/${category.slug}` : "shop/new-category"} />
            <label className="flex flex-col gap-2 text-sm font-semibold">
              SEO content (markdown, shown below the product grid)
              <textarea name="seoContent" rows={8} defaultValue={category?.seoContent ?? ""} className={`${afield} !h-auto py-2.5 font-mono !text-[13px] font-normal`} />
            </label>
          </Card>

          <Card title="FAQ">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid gap-2 border-b border-sand-2 pb-3 last:border-0 last:pb-0 sm:grid-cols-[1fr_1.4fr]">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  Question {i + 1}
                  <input name={`faqQ_${i}`} defaultValue={faq[i]?.q ?? ""} className={afield} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  Answer
                  <input name={`faqA_${i}`} defaultValue={faq[i]?.a ?? ""} className={afield} />
                </label>
              </div>
            ))}
          </Card>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Card title="Arch tile photo">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold p-5 text-center text-[13px] font-semibold hover:bg-sand-3">
              Upload 4:5 photo
              <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" />
              <span className="text-xs font-normal text-cocoa">JPG, PNG, WebP or HEIC · up to 8MB</span>
            </label>
            {category?.imageUrl ? (
              <img src={category.imageUrl} alt="" className="h-[180px] w-full rounded-t-full object-cover" />
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Or image URL
              <input name="imageUrl" defaultValue={category?.imageUrl ?? ""} className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Open Graph image URL
              <input name="ogImageUrl" defaultValue={category?.ogImageUrl ?? ""} className={afield} />
            </label>
          </Card>

          <Card title="Visibility">
            <label className="flex items-center justify-between gap-3 text-sm font-semibold">
              Status
              <select name="status" defaultValue={category?.status ?? "LIVE"} className={`${afield} !w-auto`}>
                <option value="LIVE">Live</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="showOnHome" defaultChecked={category?.showOnHome ?? true} className="h-5 w-5" />
              Show on home
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="showInFooter" defaultChecked={category?.showInFooter ?? true} className="h-5 w-5" />
              Show in footer
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Tile tone
              <input name="tone" type="color" defaultValue={category?.tone ?? "#F1EBE4"} className="h-11 w-full rounded-[10px] border border-line bg-cream px-1" />
            </label>
          </Card>

          {category ? (
            <Card title="Delete category">
              <p className="text-[13px] text-cocoa">
                {productCount} products · {childCount} children
                {childCount > 0 ? ". Move or delete the children first." : ""}
              </p>
              <div className="flex flex-col gap-2">
                <input type="hidden" name="id" value={category.id} />
                {productCount > 0 && childCount === 0 ? (
                  <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Move products to
                    <select name="moveTo" className={afield}>
                      <option value="">Choose a category…</option>
                      {moveTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button type="submit" formAction={deleteCategory} className={`${abtnGhost} !border-red-300 !text-red-700`}>
                  Delete category
                </button>
              </div>
            </Card>
          ) : null}
        </div>
      </form>
    </>
  );
}
