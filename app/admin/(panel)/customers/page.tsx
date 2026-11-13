import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { PageTitle, abtnChat, abtnGhost } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { rs } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";
import { updateCustomerTag } from "./actions";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .replace(".", "")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 80);
  const page = Math.max(1, Math.floor(Number(one(sp.page)) || 1));

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q.replace(/\D/g, "") } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        orders: { select: { total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const str = params.toString();
    return `/admin/customers${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Customers"
        sub={`${total} customers, built automatically from orders`}
        actions={
          <>
            <form action="/admin/customers" className="flex items-center gap-2">
              <label className="relative block">
                <span className="sr-only">Search customers</span>
                <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Name, phone or city"
                  className="h-[42px] w-[240px] rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm"
                />
              </label>
              <button type="submit" className={abtnGhost}>
                Search
              </button>
            </form>
            <a href={`/admin/customers/export.csv${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={abtnGhost}>
              Export CSV
            </a>
          </>
        }
      />
      <div className="overflow-x-auto rounded-[14px] border border-sand-2 bg-white">
        <table className="w-full min-w-[980px] text-left text-[13px]">
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
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-cocoa">
                  No customers yet. They are created automatically when an order is placed.
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const count = customer.orders.length;
                const spent = customer.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.total, 0);
                const last = customer.orders[0]?.createdAt;
                return (
                  <tr key={customer.id} className="border-t border-sand transition-colors hover:bg-sand-3">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-xs font-bold">
                          {initials(customer.name)}
                        </span>
                        <strong className="font-semibold">{customer.name}</strong>
                      </span>
                    </td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">{customer.city ?? "—"}</td>
                    <td className="px-4 py-3">{count}</td>
                    <td className="px-4 py-3 font-semibold">{rs(spent)}</td>
                    <td className="px-4 py-3">
                      {last
                        ? last.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateCustomerTag} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={customer.id} />
                        <input
                          name="tag"
                          defaultValue={customer.tag ?? ""}
                          aria-label={`Tag for ${customer.name}`}
                          placeholder="Add tag"
                          className="h-8 w-24 rounded-lg border border-line bg-cream px-2 text-xs"
                        />
                        <button type="submit" className="text-xs font-semibold text-caramel">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={waLink(undefined, `92${customer.phone.replace(/^0/, "")}`)}
                        target="_blank"
                        rel="noopener"
                        className={abtnChat}
                      >
                        Open chat
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3 text-sm">
          <span className="text-cocoa">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={href(page - 1)} className={abtnGhost}>
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={href(page + 1)} className={abtnGhost}>
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
