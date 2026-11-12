"use client";

import Image from "next/image";
import { ViewTransition, useEffect, useRef, useState } from "react";
import { ResinArt } from "@/components/ui";

/** Product gallery: swipeable on mobile (scroll-snap), main + thumbnails on desktop. */
export function Gallery({ slug, name, images, tone }: { slug: string; name: string; images: string[]; tone: [string, string] }) {
  const slides = images.length ? images.map((src) => ({ src })) : [0, 1, 2].map(() => ({ src: "" }));
  const track = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setI(Math.round(t.scrollLeft / Math.max(1, t.clientWidth))));
    };
    t.addEventListener("scroll", on, { passive: true });
    return () => {
      t.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (n: number) => {
    const t = track.current;
    if (!t) return;
    const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    t.scrollTo({ left: n * t.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setI(n);
  };

  const render = (s: { src: string }, n: number) =>
    s.src ? (
      <Image
        src={s.src}
        alt={n === 0 ? name : `${name}, photo ${n + 1}`}
        fill
        priority={n === 0}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
    ) : (
      <div role="img" aria-label={n === 0 ? name : `${name}, view ${n + 1}`} className="absolute inset-0">
        <ResinArt seed={n === 0 ? slug : `${slug}-${n}`} tone={tone} />
      </div>
    );

  return (
    <section aria-label="Photos" className="relative lg:sticky lg:top-[112px]">
      <div
        ref={track}
        tabIndex={0}
        aria-label={`${name} photos, ${slides.length} images`}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:overflow-hidden lg:rounded-2xl"
      >
        {slides.map((s, n) => (
          <div key={n} className="relative aspect-[4/5] w-full shrink-0 snap-start overflow-hidden">
            {n === 0 ? (
              <ViewTransition name={`product-${slug}`} share="morph" default="none">
                <div className="absolute inset-0">{render(s, n)}</div>
              </ViewTransition>
            ) : (
              render(s, n)
            )}
          </div>
        ))}
      </div>
      <span className="absolute top-3.5 right-3.5 rounded-full bg-cream/90 px-2.5 py-1 text-xs font-semibold lg:hidden">
        {i + 1} / {slides.length} · swipe
      </span>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
        {slides.map((_, n) => (
          <span
            key={n}
            className={`h-1.5 rounded-[3px] transition-all duration-300 ${n === i ? "w-[18px] bg-brown" : "w-1.5 bg-dot"}`}
          />
        ))}
      </div>
      <div className="mt-3 hidden gap-3 lg:flex">
        {slides.map((s, n) => (
          <button
            key={n}
            type="button"
            onClick={() => goTo(n)}
            aria-label={`Show photo ${n + 1}`}
            aria-current={n === i}
            className="relative aspect-[4/5] w-20 overflow-hidden rounded-xl border-2 border-transparent transition-colors aria-[current=true]:border-brown"
          >
            {s.src ? (
              <Image src={s.src} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <ResinArt seed={n === 0 ? slug : `${slug}-${n}`} tone={tone} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
