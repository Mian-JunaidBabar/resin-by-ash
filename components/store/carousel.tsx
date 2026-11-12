"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

/**
 * Native scroll-snap carousel (modern-web-guidance "carousel" pattern):
 * the track scrolls without JS; buttons + markers are progressive enhancement,
 * and a polite status region announces the slide once scrolling settles.
 * Finite on purpose (buttons disable at the ends) because slides are peeked cards, not full-width slides.
 */
export function Carousel({
  label,
  children,
  head,
  slideClass,
  trackClass = "",
}: {
  label: string;
  children: ReactNode;
  head?: ReactNode;
  slideClass: string;
  trackClass?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);
  const [current, setCurrent] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [status, setStatus] = useState("");
  const settled = useRef(0);
  const userMoved = useRef(false);

  const nearest = useCallback(() => {
    const t = track.current;
    if (!t) return 0;
    const items = Array.from(t.children) as HTMLElement[];
    const left = t.scrollLeft + parseFloat(getComputedStyle(t).scrollPaddingInlineStart || "0");
    let best = 0;
    let dist = Infinity;
    items.forEach((el, i) => {
      const d = Math.abs(el.offsetLeft - t.offsetLeft - left);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  }, []);

  const settle = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const i = nearest();
    setCurrent(i);
    setAtStart(t.scrollLeft < 4);
    setAtEnd(t.scrollLeft + t.clientWidth >= t.scrollWidth - 4);
    if (userMoved.current && i !== settled.current) setStatus(`Item ${i + 1} of ${slides.length}`);
    settled.current = i;
  }, [nearest, slides.length]);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    settle();
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      userMoved.current = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCurrent(nearest()));
      if (!("onscrollend" in window)) {
        clearTimeout(timer);
        timer = setTimeout(settle, 120);
      }
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("scrollend", settle);
    window.addEventListener("resize", settle);
    return () => {
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("scrollend", settle);
      window.removeEventListener("resize", settle);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [nearest, settle]);

  const go = (dir: 1 | -1) => {
    const t = track.current;
    if (!t) return;
    const items = Array.from(t.children) as HTMLElement[];
    const target = items[Math.max(0, Math.min(items.length - 1, nearest() + dir))];
    if (!target) return;
    userMoved.current = true;
    const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    t.scrollTo({ left: target.offsetLeft - t.offsetLeft - t.clientLeft, behavior: smooth ? "smooth" : "auto" });
  };

  const dots = Math.min(slides.length, 4);
  const activeDot = Math.min(dots - 1, Math.round((current / Math.max(1, slides.length - 1)) * (dots - 1)));

  return (
    <section aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-5 lg:gap-7">
      <div className="wrap flex items-end justify-between gap-4">
        {head}
        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={atStart}
            aria-label={`Previous: ${label}`}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-line bg-white transition-colors hover:border-brown disabled:cursor-default disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={atEnd}
            aria-label={`Next: ${label}`}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-brown bg-white transition-colors hover:bg-sand disabled:cursor-default disabled:border-line disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        ref={track}
        tabIndex={0}
        role="group"
        aria-label={`${label} items`}
        className={`no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-px-5 px-5 md:scroll-px-10 md:px-10 lg:gap-6 xl:scroll-pl-[max(120px,calc((100vw-1440px)/2+120px))] xl:pl-[max(120px,calc((100vw-1440px)/2+120px))] xl:pr-[120px] ${trackClass}`}
        style={{ touchAction: "pan-x pan-y" }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className={`shrink-0 snap-start ${slideClass}`}
          >
            {s}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex justify-center gap-1.5 lg:hidden">
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            className={`h-[3px] w-[18px] rounded-sm transition-colors duration-300 ${i === activeDot ? "bg-brown" : "bg-line"}`}
          />
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
