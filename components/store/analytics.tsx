"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const KEY = "rba-cookie-consent";

/**
 * Cookie notice + GA4. Nothing loads until the visitor accepts, and the whole
 * component disappears when no measurement ID is configured (local, previews).
 */
function subscribe(callback: () => void) {
  window.addEventListener("rba-cookie-consent", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("rba-cookie-consent", callback);
    window.removeEventListener("storage", callback);
  };
}

function readConsent(): "granted" | "denied" | null {
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved === "granted" || saved === "denied" ? saved : null;
  } catch {
    return "denied";
  }
}

export function Analytics() {
  const consent = useSyncExternalStore(subscribe, readConsent, () => null);

  if (!GA_ID) return null;

  const choose = (value: "granted" | "denied") => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      // Private mode: respect the choice for this page view only.
    }
    window.dispatchEvent(new Event("rba-cookie-consent"));
  };

  return (
    <>
      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {consent === null ? (
        <section
          aria-label="Analytics cookies"
          className="fixed bottom-4 left-4 z-[60] flex w-[calc(100%-2rem)] max-w-[380px] flex-col gap-3 rounded-2xl border border-sand-2 bg-white p-4 shadow-[var(--shadow-float)]"
        >
          <p className="text-[13px] leading-relaxed">
            We use Google Analytics to see which pieces people love. No ads, and we never sell your data.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => choose("granted")} className="btn btn-primary !h-10 flex-1 !text-[13px]">
              Accept
            </button>
            <button type="button" onClick={() => choose("denied")} className="btn btn-outline !h-10 flex-1 !text-[13px]">
              Decline
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
