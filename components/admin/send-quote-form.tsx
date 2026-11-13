"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendQuote } from "@/app/admin/(panel)/requests/actions";
import { abtnPrimary, afield } from "@/components/admin/ui";

export function SendQuoteForm({
  requestId,
  quote,
  readyBy,
}: {
  requestId: number;
  quote: number | null;
  readyBy: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <form
      className="flex flex-wrap items-end gap-3 border-t border-sand-2 pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const amount = Number(String(form.get("amount") ?? "").replace(/\D/g, ""));
        const ready = String(form.get("readyBy") ?? "");
        setError("");
        setSent(false);
        start(async () => {
          const res = await sendQuote(requestId, amount, ready);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setSent(true);
          router.refresh();
          window.open(res.waUrl, "_blank", "noopener");
        });
      }}
    >
      <input type="hidden" name="id" value={requestId} />
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Quote (Rs)
        <input
          name="amount"
          inputMode="numeric"
          required
          defaultValue={quote ?? ""}
          placeholder="e.g. 7,500"
          className={`${afield} w-40`}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Ready by
        <input name="readyBy" type="date" required defaultValue={readyBy ?? ""} className={`${afield} w-44`} />
      </label>
      <button type="submit" disabled={pending} className={abtnPrimary}>
        {pending ? "Saving…" : "Send quote"}
      </button>
      {error ? <p className="w-full text-[13px] font-medium text-[#9b3b2f]">{error}</p> : null}
      {sent ? <p className="w-full text-[13px] font-medium text-[#3f6b46]">Quote saved. WhatsApp opened in a new tab.</p> : null}
    </form>
  );
}
