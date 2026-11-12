"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { CloseIcon, FilterIcon, SearchIcon } from "@/components/icons";
import { rs } from "@/lib/pricing";

/**
 * Filter + sort controls for /shop and /shop/[category].
 * Every control writes to the URL (shareable links for Instagram bio and stories);
 * the server re-renders the grid from searchParams.
 */

export type FilterState = {
  q?: string;
  sub: string[];
  max?: number;
  sale: boolean;
  custom: boolean;
  occasion?: string;
  sort?: string;
};

type Props = {
  state: FilterState;
  total: number;
  categories: { slug: string; label: string }[];
  activeCategory?: string;
  subcategories: string[];
  occasions: readonly string[];
  priceMin: number;
  priceMax: number;
};

const SORTS = [
  { v: "newest", label: "Newest" },
  { v: "best", label: "Best selling" },
  { v: "price-asc", label: "Price: low to high" },
  { v: "price-desc", label: "Price: high to low" },
];

function toParams(s: FilterState) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.sub.length) p.set("sub", s.sub.join(","));
  if (s.max) p.set("max", String(s.max));
  if (s.sale) p.set("sale", "1");
  if (s.custom) p.set("custom", "1");
  if (s.occasion) p.set("occasion", s.occasion);
  if (s.sort && s.sort !== "newest") p.set("sort", s.sort);
  return p.toString();
}

export function ShopFilters(props: Props) {
  const { state, total, categories, activeCategory, subcategories, occasions, priceMin, priceMax } = props;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(state.q ?? "");
  const [price, setPrice] = useState(state.max ?? priceMax);
  const sheet = useRef<HTMLDialogElement>(null);
  const sheetTitle = useId();
  // Keep the slider in step when the URL changes elsewhere (adjusting state during render).
  const [seenMax, setSeenMax] = useState(state.max);
  if (seenMax !== state.max) {
    setSeenMax(state.max);
    setPrice(state.max ?? priceMax);
  }

  const push = (next: Partial<FilterState>) => {
    const qs = toParams({ ...state, ...next });
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounced search-as-you-type
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      if ((state.q ?? "") !== q.trim()) push({ q: q.trim() || undefined });
    }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitPrice = (v: number) => push({ max: v >= priceMax ? undefined : v });
  const toggleSub = (s: string) =>
    push({ sub: state.sub.includes(s) ? state.sub.filter((x) => x !== s) : [...state.sub, s] });

  const active: { label: string; clear: Partial<FilterState> }[] = [
    ...(state.q ? [{ label: `“${state.q}”`, clear: { q: undefined } }] : []),
    ...state.sub.map((s) => ({ label: s, clear: { sub: state.sub.filter((x) => x !== s) } })),
    ...(state.max ? [{ label: `Under ${rs(state.max)}`, clear: { max: undefined } }] : []),
    ...(state.sale ? [{ label: "On sale", clear: { sale: false } }] : []),
    ...(state.custom ? [{ label: "Customisable", clear: { custom: false } }] : []),
    ...(state.occasion ? [{ label: state.occasion, clear: { occasion: undefined } }] : []),
  ];
  const clearAll = () => {
    setQ("");
    setPrice(priceMax);
    start(() => router.replace(pathname, { scroll: false }));
  };

  const searchBox = (
    <label className="relative block w-full lg:w-[400px]">
      <span className="sr-only">Search {activeCategory ? categories.find((c) => c.slug === activeCategory)?.label : "pieces"}</span>
      <SearchIcon size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-cocoa lg:left-4" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && push({ q: q.trim() || undefined })}
        placeholder="Search bangles, names, colours…"
        className="field !pl-[42px] lg:!h-[50px] lg:!pl-11"
        enterKeyHint="search"
      />
    </label>
  );

  const priceControl = (id: string) => (
    <label htmlFor={id} className="flex flex-col gap-2.5 text-sm font-semibold lg:flex-row lg:items-center lg:gap-3">
      <span>
        {price >= priceMax ? "Any price" : <>Price up to {rs(price)}</>}
      </span>
      <input
        id={id}
        type="range"
        min={priceMin}
        max={priceMax}
        step={500}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        onPointerUp={(e) => commitPrice(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => commitPrice(Number((e.target as HTMLInputElement).value))}
        className="w-full lg:w-[180px]"
        aria-valuetext={price >= priceMax ? "Any price" : rs(price)}
      />
      <span className="flex justify-between text-xs font-normal lg:hidden">
        <span>{rs(priceMin)}</span>
        <span>{rs(priceMax)}+</span>
      </span>
    </label>
  );

  const sortSelect = (
    <label className="flex items-center gap-2 text-sm font-semibold">
      Sort
      <select
        value={state.sort ?? "newest"}
        onChange={(e) => push({ sort: e.target.value })}
        className="field !h-11 !w-auto !px-2.5 !text-sm lg:!h-[42px]"
      >
        {SORTS.map((s) => (
          <option key={s.v} value={s.v}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div aria-busy={pending} className="flex flex-col">
      {/* Search (mobile sits under the title; desktop on the right of the title row via CSS order) */}
      <div className="wrap pb-2 lg:hidden">{searchBox}</div>

      {/* Category chips */}
      <div className="wrap lg:hidden">
        <div role="group" aria-label="Category" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-3 md:-mx-10 md:px-10">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={c.slug === "all" ? "/shop" : `/shop/${c.slug}`}
              aria-current={(activeCategory ?? "all") === c.slug ? "page" : undefined}
              className="chip"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile: filter button + sort */}
      <div className="wrap flex items-center justify-between pt-1 pb-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => sheet.current?.showModal()}
          className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold"
        >
          <FilterIcon size={18} />
          Filter
          {active.length ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brown px-1.5 text-[11px] text-cream">
              {active.length}
            </span>
          ) : null}
        </button>
        {sortSelect}
      </div>

      {/* Desktop filter bar */}
      <div className="wrap hidden lg:block">
        <section aria-label="Filters" className="flex flex-col gap-4 border-y border-sand-2 py-[18px]">
          <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={c.slug === "all" ? "/shop" : `/shop/${c.slug}`}
                aria-current={(activeCategory ?? "all") === c.slug ? "page" : undefined}
                className="chip !px-[18px]"
              >
                {c.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-7">
            {priceControl("price-desktop")}
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={state.sale} onChange={() => push({ sale: !state.sale })} className="h-5 w-5" />
              On sale
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={state.custom} onChange={() => push({ custom: !state.custom })} className="h-5 w-5" />
              Customisable
            </label>
            {subcategories.length ? (
              <label className="flex items-center gap-2 text-sm font-semibold">
                Type
                <select
                  value={state.sub[0] ?? ""}
                  onChange={(e) => push({ sub: e.target.value ? [e.target.value] : [] })}
                  className="field !h-[42px] !w-auto !px-2.5 !text-sm"
                >
                  <option value="">Any</option>
                  {subcategories.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-semibold">
              Occasion
              <select
                value={state.occasion ?? ""}
                onChange={(e) => push({ occasion: e.target.value || undefined })}
                className="field !h-[42px] !w-auto !px-2.5 !text-sm"
              >
                <option value="">Any</option>
                {occasions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <div className="ml-auto">{sortSelect}</div>
          </div>
        </section>
      </div>

      {/* Active filters */}
      {active.length ? (
        <div aria-label="Active filters" className="wrap flex flex-wrap items-center gap-2 pb-3.5 lg:pt-4 lg:pb-0">
          {active.map((f) => (
            <button
              key={f.label}
              type="button"
              aria-label={`Remove filter ${f.label}`}
              onClick={() => {
                if ("q" in f.clear) setQ("");
                if ("max" in f.clear) setPrice(priceMax);
                push(f.clear);
              }}
              className="flex h-[34px] items-center gap-1.5 rounded-full bg-sand pr-2.5 pl-3 text-[13px] font-medium transition-colors hover:bg-sand-2 lg:pl-3.5"
            >
              {f.label}
              <CloseIcon size={14} strokeWidth={1.8} />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="h-[34px] px-1.5 text-[13px] font-semibold underline underline-offset-[3px]">
            Clear all
          </button>
        </div>
      ) : null}

      {/* Mobile bottom sheet */}
      <dialog ref={sheet} aria-labelledby={sheetTitle} {...{ closedby: "any" }} className="sheet h-[min(640px,88dvh)] lg:hidden">
        <div className="flex h-full flex-col">
          <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 rounded-sm bg-line" />
          <div className="flex items-center justify-between border-b border-sand-2 py-2 pr-3 pl-5">
            <h2 id={sheetTitle} className="font-display text-[26px] font-semibold">
              Filters
            </h2>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => sheet.current?.close()}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 py-[18px]">
            {subcategories.length ? (
              <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
                <legend className="mb-2.5 p-0 text-sm font-semibold">Category</legend>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={state.sub.includes(s)}
                      onClick={() => toggleSub(s)}
                      className="chip !h-9 !px-3.5 !text-[13px]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {priceControl("price-mobile")}
            <div className="flex flex-col gap-1">
              <label className="flex h-12 items-center justify-between border-b border-sand-2 text-[15px] font-medium">
                On sale
                <input type="checkbox" checked={state.sale} onChange={() => push({ sale: !state.sale })} className="h-[22px] w-[22px]" />
              </label>
              <label className="flex h-12 items-center justify-between border-b border-sand-2 text-[15px] font-medium">
                Customisable
                <input type="checkbox" checked={state.custom} onChange={() => push({ custom: !state.custom })} className="h-[22px] w-[22px]" />
              </label>
            </div>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2.5 p-0 text-sm font-semibold">Occasion</legend>
              <div className="flex flex-wrap gap-2">
                {occasions.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={state.occasion === o}
                    onClick={() => push({ occasion: state.occasion === o ? undefined : o })}
                    className="chip !h-9 !px-3.5 !text-[13px]"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="flex gap-2.5 border-t border-sand-2 px-5 pt-3.5 pb-5">
            <button type="button" onClick={clearAll} className="btn btn-outline !h-[50px] flex-1">
              Clear
            </button>
            <button type="button" onClick={() => sheet.current?.close()} className="btn btn-primary !h-[50px] flex-[2]">
              {pending ? "Updating…" : `Show ${total} ${total === 1 ? "piece" : "pieces"}`}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

/** Desktop search box placed in the page title row. */
export function DesktopSearch({ initial }: { initial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initial ?? "");
  const [, start] = useTransition();
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setQ(initial ?? "");
  }
  useEffect(() => {
    const t = setTimeout(() => {
      if ((initial ?? "") === q.trim()) return;
      const p = new URLSearchParams(window.location.search);
      if (q.trim()) p.set("q", q.trim());
      else p.delete("q");
      p.delete("page");
      const qs = p.toString();
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="relative hidden w-[400px] lg:block">
      <span className="sr-only">Search pieces</span>
      <SearchIcon size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-cocoa" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search bangles, names, colours…"
        className="field !h-[50px] !pl-11"
        enterKeyHint="search"
      />
    </label>
  );
}
