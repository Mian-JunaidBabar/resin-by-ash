"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Product-card hover photo. The second image is only mounted once the pointer
 * enters the card, so the initial page load does not download a full second
 * photo for every product in the grid.
 */
export function HoverMedia({ src, sizes }: { src: string; sizes: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      onMouseEnter={() => setVisible(true)}
    >
      {visible ? <Image src={src} alt="" fill sizes={sizes} className="object-cover" /> : null}
    </span>
  );
}
