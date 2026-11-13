"use client";

import { useRef } from "react";

/** Checkbox that submits its server action as soon as it changes. */
export function ToggleForm({
  action,
  id,
  field,
  checked,
  label,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  field: string;
  checked: boolean;
  label: string;
  value?: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      {value ? <input type="hidden" name="value" value={value} /> : null}
      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium">
        <input
          type="checkbox"
          name={field}
          defaultChecked={checked}
          onChange={() => form.current?.requestSubmit()}
          className="h-5 w-5"
        />
        {label}
      </label>
    </form>
  );
}
