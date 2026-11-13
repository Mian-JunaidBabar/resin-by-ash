import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, PageTitle, abtnGhost, abtnPrimary, afield } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { inviteUser } from "./actions";

export const metadata: Metadata = { title: "Admin users" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function AdminUsersPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="text-sm text-cocoa">Loading admin users…</p>}>
      <AdminUsersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminUsersContent({ searchParams }: { searchParams: Search }) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const inviteToken = typeof sp.invite === "string" ? sp.invite : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const [users, invites] = await Promise.all([
    db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, name: true, role: true, createdAt: true } }),
    db.invite.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  return (
    <>
      <PageTitle
        title="Admin users"
        back={{ href: "/admin/settings", label: "Settings" }}
        sub="Invite someone to help with orders. Links work once and expire after 24 hours."
      />

      {inviteToken ? (
        <Card title="Invite link ready">
          <p className="text-sm">Send this one-time link to the new admin. It expires in 24 hours.</p>
          <input readOnly value={`${SITE.url}/admin/invite/${inviteToken}`} className={afield} />
          <p className="text-xs text-cocoa">The link can only be used once, and only to set a password.</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-[18px]">
        <Card pad={false} title="People with access">
          <div className="flex flex-col divide-y divide-sand-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 px-[18px] py-3">
                <div className="flex flex-col">
                  <strong className="text-sm">
                    {user.name} {user.id === session.user.id ? <span className="font-normal text-cocoa">(you)</span> : null}
                  </strong>
                  <span className="text-[13px] text-cocoa">{user.email}</span>
                </div>
                <span className="rounded-full bg-sand px-2.5 py-[3px] text-xs font-semibold">{user.role}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Invite someone">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error === "forbidden" ? "Only an owner can invite another owner." : "Enter a valid email address."}
            </p>
          ) : null}
          <form action={inviteUser} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Email
              <input type="email" name="email" required className={afield} placeholder="name@example.com" />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Role
              <select name="role" className={afield} defaultValue="DEVELOPER">
                <option value="DEVELOPER">Developer — everything except owner-only actions</option>
                <option value="OWNER">Owner — full access</option>
              </select>
            </label>
            <button type="submit" className={abtnPrimary}>
              Create invite link
            </button>
          </form>
          {invites.length ? (
            <div className="mt-2 flex flex-col gap-1.5 border-t border-sand-2 pt-3 text-xs text-cocoa">
              <strong className="text-brown">Pending invites</strong>
              {invites.map((i) => (
                <span key={i.id}>
                  {i.email} · {i.role} · expires {i.expiresAt.toLocaleDateString("en-GB", { timeZone: "Asia/Karachi" })}
                </span>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div>
        <Link href="/admin/settings" className={abtnGhost}>
          Back to settings
        </Link>
      </div>
    </>
  );
}
