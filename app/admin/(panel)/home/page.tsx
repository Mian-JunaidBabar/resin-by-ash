import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, PageTitle, abtn, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { moveReview, moveSocial, saveHome } from "./actions";

export const metadata: Metadata = { title: "Home page" };

const inputDate = (value: Date | null) =>
  value ? value.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }) : "";

function Field({ label, name, value, placeholder, type = "text" }: { label: string; name: string; value?: string | null; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <input type={type} name={name} defaultValue={value ?? ""} placeholder={placeholder} className={afield} />
    </label>
  );
}

function Area({ label, name, value, rows = 3 }: { label: string; name: string; value?: string | null; rows?: number }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <textarea name={name} defaultValue={value ?? ""} rows={rows} className={`${afield} h-auto py-2.5`} />
    </label>
  );
}

function Upload({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="h-11 w-full rounded-[10px] border border-line bg-white px-2.5 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-sand file:px-2.5 file:py-1.5 file:text-xs file:font-semibold"
      />
    </label>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading home content…</p>}>
      <AdminHomeContent />
    </Suspense>
  );
}

async function AdminHomeContent() {
  await requireAdmin();
  const [content, reviews, social] = await Promise.all([
    db.homeContent.findUnique({ where: { id: 1 } }),
    db.review.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.socialTile.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  if (!content) return <p>Home content is missing. Run the seed.</p>;

  const steps = (content.steps as { title: string; text: string }[]) ?? [];

  return (
    <>
      <PageTitle
        eyebrow="Website"
        title="Home page"
        sub="Edit the copy, photos and sections visitors see first. Changes go live as soon as you save."
        actions={
          <>
            <a href="/" className={abtnGhost} target="_blank" rel="noopener">
              View home
            </a>
            <button type="submit" form="home-form" className={abtnPrimary}>
              Save changes
            </button>
          </>
        }
      />

      <form id="home-form" action={saveHome} className="flex flex-col gap-[18px]">
        <Card title="Hero">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <Field label="Eyebrow" name="heroEyebrow" value={content.heroEyebrow} />
            <Field label="Headline" name="heroHeadline" value={content.heroHeadline} />
            <Field label="Italic ending" name="heroHeadlineEm" value={content.heroHeadlineEm} />
            <Field label="Hero image URL (4:5)" name="heroImageUrl" value={content.heroImageUrl} placeholder="/uploads/hero.jpg" />
            <Upload label="Or upload a new hero photo" name="heroFile" />
          </div>
          <Area label="Subcopy" name="heroSubcopy" value={content.heroSubcopy} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <Field label="Primary button label" name="primaryCtaLabel" value={content.primaryCtaLabel} />
            <Field label="Primary button link" name="primaryCtaHref" value={content.primaryCtaHref} />
            <Field label="Secondary button label" name="secondaryCtaLabel" value={content.secondaryCtaLabel} />
            <Field label="Secondary button link" name="secondaryCtaHref" value={content.secondaryCtaHref} />
          </div>
        </Card>

        <Card title="Seasonal hero" action={<span className="text-xs text-cocoa">Shows only between these dates</span>}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <Field label="Seasonal headline" name="seasonalHeadline" value={content.seasonalHeadline} placeholder="Wedding season is here" />
            <Field label="Seasonal image URL" name="seasonalImageUrl" value={content.seasonalImageUrl} />
            <Upload label="Or upload a seasonal photo" name="seasonalFile" />
            <Field label="Active from" name="seasonalFrom" type="date" value={inputDate(content.seasonalFrom)} />
            <Field label="Active to" name="seasonalTo" type="date" value={inputDate(content.seasonalTo)} />
          </div>
          <p className="text-xs text-cocoa">Leave the headline empty to always show the default hero.</p>
        </Card>

        <Card title="Flower preservation">
          <Field label="Headline" name="flowerHeadline" value={content.flowerHeadline} />
          <Area label="Copy" name="flowerCopy" value={content.flowerCopy} rows={4} />
          <Field label="Image URL (4:5)" name="flowerImageUrl" value={content.flowerImageUrl} />
          <Upload label="Or upload a new flower photo" name="flowerFile" />
        </Card>

        <Card title="Custom order steps">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 border-b border-sand-2 pb-3 last:border-0 last:pb-0">
              <Field label={`Step ${i + 1} title`} name={`step.${i}.title`} value={steps[i]?.title} />
              <Field label={`Step ${i + 1} text`} name={`step.${i}.text`} value={steps[i]?.text} />
            </div>
          ))}
        </Card>

        <Card pad={false} title="Reviews" action={<span className="text-xs text-cocoa">Publish and order the chat screenshots</span>}>
          <div className="flex flex-col divide-y divide-sand-2">
            {reviews.map((r, index) => (
              <div key={r.id} className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-end gap-3 p-[18px]">
                <input type="hidden" name="reviewIds" value={r.id} />
                <Field label={`Caption ${index + 1}`} name={`reviewCaption_${r.id}`} value={r.caption} placeholder="Ayesha, Lahore" />
                <Field label="Screenshot URL" name={`reviewImage_${r.id}`} value={r.imageUrl} placeholder="/uploads/review-1.jpg" />
                <Upload label="Or upload a screenshot" name={`reviewFile_${r.id}`} />
                <Field label="Order" name={`reviewOrder_${r.id}`} value={String(r.sortOrder)} type="number" />
                <label className="flex h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name={`reviewPublished_${r.id}`} defaultChecked={r.published} className="h-5 w-5" />
                  Published
                </label>
                <div className="flex gap-1.5">
                  <button type="submit" formAction={moveReview} name="move" value={`${r.id}:up`} className={`${abtn} !h-9 border border-line bg-white !px-2.5`} aria-label={`Move review ${index + 1} up`}>
                    ↑
                  </button>
                  <button type="submit" formAction={moveReview} name="move" value={`${r.id}:down`} className={`${abtn} !h-9 border border-line bg-white !px-2.5`} aria-label={`Move review ${index + 1} down`}>
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false} title="Social tiles">
          <div className="flex flex-col divide-y divide-sand-2">
            {social.map((t, index) => (
              <div key={t.id} className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-end gap-3 p-[18px]">
                <input type="hidden" name="socialIds" value={t.id} />
                <Field label={`Label ${index + 1}`} name={`socialLabel_${t.id}`} value={t.label} placeholder="Reel" />
                <Field label="Link" name={`socialHref_${t.id}`} value={t.href} />
                <Field label="Image URL" name={`socialImage_${t.id}`} value={t.imageUrl} placeholder="/uploads/social-1.jpg" />
                <Upload label="Or upload an image" name={`socialFile_${t.id}`} />
                <Field label="Order" name={`socialOrder_${t.id}`} value={String(t.sortOrder)} type="number" />
                <div className="flex gap-1.5">
                  <button type="submit" formAction={moveSocial} name="move" value={`${t.id}:up`} className={`${abtn} !h-9 border border-line bg-white !px-2.5`} aria-label={`Move social tile ${index + 1} up`}>
                    ↑
                  </button>
                  <button type="submit" formAction={moveSocial} name="move" value={`${t.id}:down`} className={`${abtn} !h-9 border border-line bg-white !px-2.5`} aria-label={`Move social tile ${index + 1} down`}>
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <button type="submit" className={abtnPrimary}>
            Save changes
          </button>
        </div>
      </form>
    </>
  );
}
