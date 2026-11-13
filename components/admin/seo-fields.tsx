"use client";

import { useState } from "react";
import { afield } from "@/components/admin/ui";

/** Meta title/description with live counters and a Google snippet preview. */
export function SeoFields({
  title,
  description,
  path,
  name,
}: {
  title?: string | null;
  description?: string | null;
  path: string;
  name?: string | null;
}) {
  const [metaTitle, setMetaTitle] = useState(title ?? "");
  const [metaDescription, setMetaDescription] = useState(description ?? "");
  const [shopName, setShopName] = useState(name ?? "");

  return (
    <>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        <span className="flex items-center justify-between">
          SEO meta title
          <span className={metaTitle.length > 60 ? "text-xs font-normal text-red-700" : "text-xs font-normal text-cocoa"}>
            {metaTitle.length}/60
          </span>
        </span>
        <input
          name="metaTitle"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          maxLength={60}
          className={afield}
          placeholder="Jewellery · Handmade resin in Pakistan"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        <span className="flex items-center justify-between">
          Meta description
          <span className={metaDescription.length > 155 ? "text-xs font-normal text-red-700" : "text-xs font-normal text-cocoa"}>
            {metaDescription.length}/155
          </span>
        </span>
        <textarea
          name="metaDescription"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          maxLength={155}
          rows={3}
          className={`${afield} !h-auto py-2.5 font-normal`}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Shop name (for the snippet)
        <input value={shopName} onChange={(e) => setShopName(e.target.value)} className={afield} placeholder="Jewellery" />
      </label>
      <div className="rounded-xl border border-line bg-white p-4">
        <span className="text-xs font-semibold tracking-[0.08em] text-cocoa uppercase">Google preview</span>
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-[13px] text-[#202124]">resinbyash.pk › {path.replace(/^\//, "")}</span>
          <span className="text-[18px] leading-snug text-[#1a0dab]">{metaTitle || "Page title"}</span>
          <span className="text-[13px] leading-snug text-[#4d5156]">{metaDescription || "Meta description appears here."}</span>
        </div>
      </div>
    </>
  );
}
