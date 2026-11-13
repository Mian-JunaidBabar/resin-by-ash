"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Storefront error boundary. Keeps the shop chrome and offers a way back. */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the digest in the browser console for support; the full error stays server-side.
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <section className="wrap flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="eyebrow">A small spill</span>
      <h1 className="max-w-xl font-display text-[42px] leading-[1.04] font-medium lg:text-6xl">
        This page didn’t <em>set right.</em>
      </h1>
      <p className="max-w-md text-[15px] leading-relaxed">
        Something went wrong on our side. Try again, or message Ash on WhatsApp and she’ll help you finish your order.
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Back to home
        </Link>
      </div>
    </section>
  );
}
