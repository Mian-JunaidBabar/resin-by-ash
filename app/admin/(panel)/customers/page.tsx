import type { Metadata } from "next";
import { SearchIcon } from "@/components/icons";
import { PageTitle, Pill, abtnChat, abtnGhost } from "@/components/admin/ui";
import { CUSTOMERS, initials } from "@/lib/data/admin";
import { rs } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Customers" };

/** Customers are built from orders (upsert by phone). Phase 2: search + pagination on the server, CSV export route. */
export default function CustomersPage() {
  return (
    <>
      <PageTitle
        title="Customers"
        sub="212 customers · 38 have ordered more than once"
        actions={
          <>
            <label className="relative block">
              <span className="sr-only">Search customers</span>
              <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
              <input
                type="search"
                placeholder="Name, phone or city"
                className="h-[42px] w-[240px] rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm"
              />
            </label>
            <button type="button" className={abtnGhost}>
              Export CSV
            </button>
          </>
        }
      />
      <div className="overflow-x-auto rounded-[14px] border border-sand-2 bg-white">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="text-cocoa">
            <tr>
              {["Customer", "WhatsApp", "City", "Orders", "Total spent", "Last order", "Tag", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((c) => (
              <tr key={c.name} className="border-t border-sand transition-colors hover:bg-sand-3">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-xs font-bold">
                      {initials(c.name)}
                    </span>
                    <strong className="font-semibold">{c.name}</strong>
                  </span>
                </td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3 font-semibold">{rs(c.spent)}</td>
                <td className="px-4 py-3">{c.last}</td>
                <td className="px-4 py-3">{c.tag ? <Pill className="bg-sand text-brown">{c.tag}</Pill> : null}</td>
                <td className="px-4 py-3">
                  <a href={waLink()} target="_blank" rel="noopener" className={abtnChat}>
                    Open chat
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
