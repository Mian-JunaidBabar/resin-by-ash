"use client";

import { useId, useState, useTransition } from "react";
import { sendContactMessage } from "@/app/(store)/actions";

export function ContactForm() {
  const id = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = (fd: FormData) =>
    start(async () => {
      const res = await sendContactMessage({
        name: String(fd.get("name") ?? ""),
        contact: String(fd.get("contact") ?? ""),
        message: String(fd.get("message") ?? ""),
      });
      if (res.ok) setDone(true);
      else setErrors(res.errors);
    });

  if (done)
    return (
      <div role="status" className="rounded-2xl border border-gold bg-white p-6">
        <h2 className="font-display text-[28px] leading-[1.1] font-medium">Message sent</h2>
        <p className="mt-2 text-[15px] leading-relaxed">Thank you. Ash will reply on the number or email you left.</p>
      </div>
    );

  const field = (k: string, label: string, el: "input" | "textarea", extra: object = {}) => (
    <label className="label" htmlFor={`${id}-${k}`}>
      {label}
      {el === "input" ? (
        <input
          id={`${id}-${k}`}
          name={k}
          aria-invalid={errors[k] ? true : undefined}
          aria-describedby={errors[k] ? `${id}-${k}-e` : undefined}
          className="field font-normal"
          {...extra}
        />
      ) : (
        <textarea
          id={`${id}-${k}`}
          name={k}
          rows={4}
          aria-invalid={errors[k] ? true : undefined}
          aria-describedby={errors[k] ? `${id}-${k}-e` : undefined}
          className="field font-normal"
          {...extra}
        />
      )}
      {errors[k] ? (
        <span id={`${id}-${k}-e`} className="text-[13px] font-medium text-[#9b3b2f]">
          {errors[k]}
        </span>
      ) : null}
    </label>
  );

  return (
    <form action={submit} className="flex flex-col gap-4">
      <h2 className="font-display text-[28px] leading-[1.1] font-medium lg:text-4xl">Or leave a message</h2>
      <fieldset disabled={pending} className="m-0 flex flex-col gap-4 border-0 p-0">
        {field("name", "Name", "input", { type: "text", autoComplete: "name", required: true })}
        {field("contact", "WhatsApp or email", "input", { type: "text", required: true })}
        {field("message", "Message", "textarea", { required: true })}
        <button type="submit" className="btn btn-outline !h-[50px]">
          {pending ? "Sending…" : "Send message"}
        </button>
      </fieldset>
    </form>
  );
}
