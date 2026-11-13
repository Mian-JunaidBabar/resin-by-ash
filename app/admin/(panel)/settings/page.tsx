import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageTitle, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { getSettings } from "@/lib/queries";
import { ORDER_TEMPLATE_PLACEHOLDERS } from "@/lib/settings-validation";
import { deleteZone, moveZone, saveSettings, saveZone } from "./actions";

export const metadata: Metadata = { title: "Settings" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const ERRORS: Record<string, string> = {
  whatsapp: "Enter a WhatsApp number with 10–15 digits, including the country code.",
  template: "The order message could not be saved.",
  prefix: "The order ID prefix cannot be empty or contain spaces.",
  zone: "A delivery zone needs a name and at least one city.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const [settings, zones, users] = await Promise.all([
    getSettings(),
    db.deliveryZone.findMany({ orderBy: [{ position: "asc" }, { label: "asc" }] }),
    db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true } }),
  ]);
  const error = one(sp.error);
  const saved = one(sp.saved);
  const hours = settings.studioHours.map((h) => `${h.days} | ${h.hours}`).join("\n");
  const synonyms = Object.entries(settings.searchSynonyms)
    .map(([from, to]) => `${from}=${to}`)
    .join("\n");

  return (
    <>
      <PageTitle
        title="Settings"
        sub="Everything the storefront reads lives here. Changes show up on the next request."
        actions={
          <button type="submit" form="settings-form" className={abtnPrimary}>
            Save changes
          </button>
        }
      />

      {saved ? (
        <p role="status" className="rounded-[10px] border border-[#c7ddc9] bg-[#eef7ef] px-4 py-3 text-sm text-[#315c37]">
          Saved. The storefront and admin have been refreshed.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[10px] border border-[#e7c4bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#7a2f24]">
          {ERRORS[error] ?? "Please check the form."} {one(sp.message) ? ` ${one(sp.message)}` : ""}
        </p>
      ) : null}

      <form id="settings-form" action={saveSettings} className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
        <Card title="Store & contact">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            WhatsApp number for orders
            <input name="whatsappNumber" defaultValue={settings.whatsappNumber} required inputMode="tel" className={afield} />
            <span className="text-xs font-normal text-cocoa">Digits only, with country code: 923001234567</span>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Number shown to customers
            <input name="whatsappDisplay" defaultValue={settings.whatsappDisplay} className={afield} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Instagram
              <input name="instagram" defaultValue={settings.instagram} className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              TikTok
              <input name="tiktok" defaultValue={settings.tiktok} className={afield} />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Studio hours
            <textarea name="studioHours" defaultValue={hours} rows={3} className={`${afield} !h-auto py-2.5 font-normal`} />
            <span className="text-xs font-normal text-cocoa">One line per row: Monday – Saturday | 10am – 7pm</span>
          </label>
        </Card>

        <Card title="Announcement bar">
          <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
            <span className="flex flex-col">
              <strong className="text-sm font-semibold">Show on every page</strong>
              <span className="text-xs text-cocoa">Turn off to hide the bar across the storefront.</span>
            </span>
            <input type="checkbox" name="announcementOn" defaultChecked={settings.announcementOn} className="h-5 w-5 shrink-0" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Text
            <input name="announcement" defaultValue={settings.announcement} className={afield} />
          </label>
          <div className="rounded-lg bg-sand px-3 py-2 text-center text-xs">{settings.announcement}</div>
        </Card>

        <Card title="Orders & WhatsApp checkout">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Order ID prefix
              <input name="orderPrefix" defaultValue={settings.orderPrefix} required className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Default lead time
              <input name="defaultLeadTime" defaultValue={settings.defaultLeadTime} className={afield} />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            WhatsApp order message
            <textarea name="orderMessageTemplate" defaultValue={settings.orderMessageTemplate} rows={8} className={`${afield} !h-auto py-2.5 font-normal`} />
          </label>
          <span className="text-xs font-normal text-cocoa">
            Placeholders: {ORDER_TEMPLATE_PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}. Unknown placeholders are rejected.
          </span>
          <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
            <span className="flex flex-col">
              <strong className="text-sm font-semibold">Accept Cash on Delivery</strong>
              <span className="text-xs text-cocoa">Shown in the cart and product pages.</span>
            </span>
            <input type="checkbox" name="acceptCod" defaultChecked={settings.acceptCod} className="h-5 w-5 shrink-0" />
          </label>
        </Card>

        <Card title="Search synonyms">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Words customers type → what to search
            <textarea name="searchSynonyms" defaultValue={synonyms} rows={5} className={`${afield} !h-auto py-2.5 font-normal`} />
            <span className="text-xs font-normal text-cocoa">One per line, for example nikah=nikkah</span>
          </label>
        </Card>
      </form>

      <Card
        title="Delivery charges"
        action={<span className="text-xs text-cocoa">Order controls the cart city list</span>}
      >
        <div className="flex flex-col gap-3">
          {zones.map((zone) => (
            <form key={zone.id} action={saveZone} className="grid items-end gap-2 rounded-xl border border-sand-2 bg-cream p-3 sm:grid-cols-[1.1fr_1.5fr_90px_90px_auto]">
              <input type="hidden" name="id" value={zone.id} />
              <input type="hidden" name="position" value={zone.position} />
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
                Zone
                <input name="label" defaultValue={zone.label} required className={`${afield} !h-9 !bg-white`} />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
                Cities (comma separated)
                <input name="cities" defaultValue={zone.cities.join(", ")} required className={`${afield} !h-9 !bg-white`} />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
                Charge (Rs)
                <input name="charge" defaultValue={zone.charge} inputMode="numeric" className={`${afield} !h-9 !bg-white`} />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
                Days
                <input name="days" defaultValue={zone.days} className={`${afield} !h-9 !bg-white`} />
              </label>
              <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                <button type="submit" className={`${abtnGhost} !h-9 !px-3 !text-xs`}>
                  Save
                </button>
                <button type="submit" formAction={moveZone} name="direction" value="up" aria-label={`Move ${zone.label} up`} className={`${abtnGhost} !h-9 !px-2 !text-xs`}>
                  ↑
                </button>
                <button type="submit" formAction={moveZone} name="direction" value="down" aria-label={`Move ${zone.label} down`} className={`${abtnGhost} !h-9 !px-2 !text-xs`}>
                  ↓
                </button>
                <button type="submit" formAction={deleteZone} className="text-xs font-semibold text-[#9b3b2f]">
                  Delete
                </button>
              </div>
            </form>
          ))}

          <form action={saveZone} className="grid items-end gap-2 rounded-xl border border-dashed border-gold bg-white p-3 sm:grid-cols-[1.1fr_1.5fr_90px_90px_auto]">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
              New zone
              <input name="label" placeholder="e.g. Sialkot" required className={`${afield} !h-9`} />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
              Cities
              <input name="cities" placeholder="Sialkot, Gujranwala" required className={`${afield} !h-9`} />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
              Charge
              <input name="charge" placeholder="350" inputMode="numeric" className={`${afield} !h-9`} />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-cocoa">
              Days
              <input name="days" placeholder="3–4" className={`${afield} !h-9`} />
            </label>
            <button type="submit" className={`${abtnGhost} !h-9 !px-3 !text-xs`}>
              + Add zone
            </button>
          </form>
        </div>
      </Card>

      <Card
        title="Admin users"
        action={
          <Link href="/admin/settings/users" className={`${abtnGhost} !h-9 !text-[13px]`}>
            Manage
          </Link>
        }
      >
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-sm font-bold">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm">
              <strong className="font-semibold">{user.name}</strong>
              <br />
              <span className="text-xs text-cocoa">
                {user.email} · {user.role === "OWNER" ? "Owner" : "Developer"}
              </span>
            </span>
          </div>
        ))}
      </Card>
    </>
  );
}
