import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { PageTitle, Pill, abtnGhost } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS, REQUEST_STATUS_STYLES, requestAge } from "@/lib/requests";
import type { RequestStatus } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Custom requests" };

const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (REQUEST_STATUSES as string[]).includes(one(sp.status)) ? (one(sp.status) as RequestStatus) : undefined;
  const q = one(sp.q).slice(0, 80);
  const page = Math.max(1, Math.floor(Number(one(sp.page)) || 1));

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { item: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [counts, total, requests, unread] = await Promise.all([
    db.customRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    db.customRequest.count({ where }),
    db.customRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tabs: { label: string; value?: RequestStatus }[] = [
    { label: "All" },
    ...REQUEST_STATUSES.map((value) => ({ label: REQUEST_STATUS_LABELS[value], value })),
  ];
  const href = (value?: RequestStatus, nextPage = 1) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const str = params.toString();
    return `/admin/requests${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Custom requests"
        sub="From the Custom order form. Every request is also handed off to WhatsApp."
        actions={
          <>
            <form action="/admin/requests" className="flex items-center gap-2">
              {status ? <input type="hidden" name="status" value={status} /> : null}
              <label className="relative block">
                <span className="sr-only">Search requests</span>
                <SearchIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-cocoa" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Name, phone or item"
                  className="h-[42px] w-[220px] rounded-[10px] border border-line bg-white pr-3 pl-10 text-sm"
                />
              </label>
              <button type="submit" className={abtnGhost}>
                Search
              </button>
            </form>
            <Link href="/admin/requests/messages" className={abtnGhost}>
              Messages{unread ? ` · ${unread} new` : ""}
            </Link>
          </>
        }
      />

      <div role="tablist" aria-label="Request status" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-sand-2">
        {tabs.map((tab) => {
          const active = status === tab.value;
          const count = tab.value ? (countBy[tab.value] ?? 0) : counts.reduce((sum, c) => sum + c._count._all, 0);
          return (
            <Link
              key={tab.label}
              href={href(tab.value)}
              role="tab"
              aria-selected={active}
              className={`flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm no-underline ${
                active ? "border-caramel font-bold text-brown" : "border-transparent font-medium text-cocoa hover:text-brown"
              }`}
            >
              {tab.label} <span className="text-xs font-normal">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-sand-2 bg-white">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="text-cocoa">
            <tr>
              {["Request", "Customer", "Item", "Budget", "Received", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-cocoa">
                  No custom requests yet. They appear here as soon as someone uses the custom order form.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-t border-sand transition-colors hover:bg-sand-3">
                  <td className="px-4 py-3 font-semibold">#{r.id}</td>
                  <td className="px-4 py-3">
                    <strong className="font-semibold">{r.name}</strong>
                    <br />
                    <span className="text-cocoa">{r.phone}</span>
                  </td>
                  <td className="px-4 py-3">{r.item}</td>
                  <td className="px-4 py-3">{r.budget}</td>
                  <td className="px-4 py-3">
                    {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" })}
                    <br />
                    <span className="text-cocoa">{requestAge(r.createdAt)} ago</span>
                  </td>
                  <td className="px-4 py-3">
                    <Pill className={REQUEST_STATUS_STYLES[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/requests/${r.id}`} className="link-underline font-semibold">
                      Open
                    </Link>
                  </td>
                </tr>
              ))
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
              <Link href={href(status, page - 1)} className={abtnGhost}>
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={href(status, page + 1)} className={abtnGhost}>
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
