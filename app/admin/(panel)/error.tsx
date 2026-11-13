"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Admin panel error boundary. The panel shell is rendered by the parent layout. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <section className="flex flex-col items-start gap-4 rounded-[14px] border border-sand-2 bg-white p-6">
      <span className="text-[13px] text-cocoa">Admin</span>
      <h1 className="font-display text-4xl leading-[1.05] font-semibold">That screen could not load.</h1>
      <p className="max-w-lg text-sm leading-relaxed text-cocoa">
        The database may be busy, or this record may have moved. Nothing was lost. Try again or go back to the dashboard.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={reset} className="inline-flex h-[42px] items-center rounded-[10px] bg-caramel px-4 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/admin" className="inline-flex h-[42px] items-center rounded-[10px] border border-line bg-white px-4 text-sm font-semibold no-underline">
          Dashboard
        </Link>
      </div>
    </section>
  );
}
