import type { Metadata } from "next";
import { Card, PageTitle, Toggle, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { DELIVERY_ZONES } from "@/lib/delivery";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Settings" };

const TEMPLATE = `Hi Ash! New order {order_id}
{items_with_personalisation}
Total: {total} (Cash on Delivery)
Name: {name} · City: {city}
Address: {address}`;

/** Phase 2: one Settings row in the database; saveSettings server action; storefront reads it via lib/queries.ts. */
export default function SettingsPage() {
  return (
    <form className="flex flex-col gap-6">
      <PageTitle
        title="Settings"
        actions={
          <button type="submit" className={abtnPrimary}>
            Save changes
          </button>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
        <Card title="Store & contact">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            WhatsApp number for orders
            <input defaultValue={SITE.whatsappDisplay} className={afield} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Instagram
              <input defaultValue={SITE.instagramHandle} className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              TikTok
              <input defaultValue={SITE.tiktokHandle} className={afield} />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Studio hours
            <input defaultValue="Mon–Sat, 10am–7pm" className={afield} />
          </label>
        </Card>
        <Card title="Announcement bar">
          <Toggle label="Show on every page" defaultChecked />
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Text
            <input defaultValue={SITE.announcement} className={afield} />
          </label>
          <div className="rounded-lg bg-sand px-3 py-2 text-center text-xs">{SITE.announcement}</div>
        </Card>
        <Card title="Orders & WhatsApp checkout">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Order ID prefix
              <input defaultValue={SITE.orderPrefix} className={afield} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Default lead time
              <input defaultValue={SITE.defaultLeadTime} className={afield} />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            WhatsApp order message
            <textarea defaultValue={TEMPLATE} rows={6} className={`${afield} !h-auto py-2.5 font-normal`} />
            <span className="text-xs font-normal text-cocoa">Words in braces fill in automatically.</span>
          </label>
          <Toggle label="Accept Cash on Delivery" defaultChecked />
        </Card>
        <Card
          title="Delivery charges"
          action={
            <button type="button" className={`${abtnGhost} !h-9 !text-[13px]`}>
              + Add city
            </button>
          }
        >
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-cocoa">
              <tr>
                <th className="pb-2 font-semibold">City</th>
                <th className="pb-2 font-semibold">Charge</th>
                <th className="pb-2 font-semibold">Days</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERY_ZONES.map((z) => (
                <tr key={z.label} className="border-t border-sand">
                  <td className="py-2 pr-2 font-semibold">{z.label}</td>
                  <td className="py-2 pr-2">
                    <input defaultValue={`Rs ${z.charge}`} aria-label={`${z.label} charge`} className={`${afield} !h-9`} />
                  </td>
                  <td className="py-2">
                    <input defaultValue={z.days} aria-label={`${z.label} days`} className={`${afield} !h-9`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card
          title="Admin users"
          action={
            <button type="button" className={`${abtnGhost} !h-9 !text-[13px]`}>
              Invite
            </button>
          }
        >
          {[
            { i: "A", name: "Ash", role: "Owner" },
            { i: "D", name: "Deep Dev Solutions", role: "Developer · support access" },
          ].map((u) => (
            <div key={u.name} className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-sm font-bold">
                {u.i}
              </span>
              <span className="text-sm">
                <strong className="font-semibold">{u.name}</strong>
                <br />
                <span className="text-xs text-cocoa">{u.role}</span>
              </span>
            </div>
          ))}
        </Card>
      </div>
    </form>
  );
}
