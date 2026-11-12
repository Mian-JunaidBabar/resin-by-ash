import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { abtnPrimary, afield } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Sign in" };

/** Not in the design set; built in the same style. Phase 2 wires this to auth (docs/phase-2/04-auth-and-admin.md). */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sand px-4">
      <form action="/admin" className="flex w-full max-w-[380px] flex-col gap-5 rounded-2xl border border-sand-2 bg-white p-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/brand/logo-256.png" alt="Resin by Ash" width={72} height={72} className="rounded-full" priority />
          <h1 className="font-display text-3xl font-semibold">Studio admin</h1>
          <p className="text-sm text-cocoa">Sign in to manage orders and products.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Email
          <input type="email" name="email" autoComplete="username" required className={afield} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Password
          <input type="password" name="password" autoComplete="current-password" required className={afield} />
        </label>
        <button type="submit" className={`${abtnPrimary} !h-12`}>
          Sign in
        </button>
        <Link href="/" className="text-center text-[13px] underline underline-offset-[3px]">
          Back to the store
        </Link>
      </form>
    </main>
  );
}
