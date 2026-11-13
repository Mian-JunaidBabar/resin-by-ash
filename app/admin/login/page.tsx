import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { abtnPrimary, afield } from "@/components/admin/ui";
import { login } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  invalid: "Enter a valid email and password.",
  credentials: "Email or password is incorrect.",
  throttled: "Too many attempts. Try again in 15 minutes.",
  forbidden: "That account does not have access to this area.",
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function LoginPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sand px-4">
      <Suspense fallback={<LoginCard />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function LoginCard({ error, next, notice }: { error?: string; next?: string; notice?: string }) {
  return (
    <form action={login} className="flex w-full max-w-[380px] flex-col gap-5 rounded-2xl border border-sand-2 bg-white p-7">
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/brand/logo-256.png" alt="Resin by Ash" width={72} height={72} className="rounded-full" priority />
        <h1 className="font-display text-3xl font-semibold">Studio admin</h1>
        <p className="text-sm text-cocoa">Sign in to manage orders and products.</p>
      </div>
      {notice ? (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-[13px] font-medium text-green-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
          {error}
        </p>
      ) : null}
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
  );
}

async function LoginForm({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const code = typeof sp.error === "string" ? sp.error : undefined;
  const next = typeof sp.next === "string" ? sp.next : "/admin";
  const notice = sp.ready === "1" ? "Password set. Sign in with your new password." : undefined;
  return <LoginCard error={code ? (ERRORS[code] ?? ERRORS.credentials) : undefined} notice={notice} next={next} />;
}
