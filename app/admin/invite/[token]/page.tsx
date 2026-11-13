import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { abtnPrimary, afield } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { acceptInvite } from "./actions";

export const metadata: Metadata = { title: "Accept invite" };

type Params = Promise<{ token: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export default function InvitePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sand px-4 py-10">
      <Suspense fallback={<InviteCard title="Loading invite…" />}>
        <InviteContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function InviteCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-5 rounded-2xl border border-sand-2 bg-white p-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/brand/logo-256.png" alt="Resin by Ash" width={64} height={64} className="rounded-full" />
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

async function InviteContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const invite = await db.invite.findUnique({ where: { token } });
  const code = typeof sp.error === "string" ? sp.error : undefined;

  if (!invite || invite.usedAt || invite.expiresAt <= new Date()) {
    return (
      <InviteCard title="Invite unavailable">
        <p className="text-center text-sm text-cocoa">
          This link has expired or has already been used. Ask the studio owner for a new invite.
        </p>
        <Link href="/admin/login" className={`${abtnPrimary} !h-11`}>
          Back to sign in
        </Link>
      </InviteCard>
    );
  }

  return (
    <form action={acceptInvite} className="flex w-full max-w-[420px] flex-col gap-5 rounded-2xl border border-sand-2 bg-white p-7">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/brand/logo-256.png" alt="Resin by Ash" width={64} height={64} className="rounded-full" />
        <h1 className="font-display text-2xl font-semibold">Set your password</h1>
        <p className="text-sm text-cocoa">
          Welcome to the studio, <strong>{invite.email}</strong>. This link works once and expires 24 hours after it was sent.
        </p>
      </div>
      {code === "expired" ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
          That link has expired or was already used.
        </p>
      ) : null}
      {code === "invalid" ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
          Use at least 8 characters and make sure both passwords match.
        </p>
      ) : null}
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Your name
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={afield} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Password
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={afield} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Confirm password
        <input type="password" name="confirm" required minLength={8} autoComplete="new-password" className={afield} />
      </label>
      <button type="submit" className={`${abtnPrimary} !h-12`}>
        Set password and continue
      </button>
    </form>
  );
}
