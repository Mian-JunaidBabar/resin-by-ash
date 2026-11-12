import Link from "next/link";
import { Suspense } from "react";
import { DesktopSearch, ShopFilters } from "@/components/store/shop-filters";
import { ArchFrame, Breadcrumbs, JsonLd, ProductCard } from "@/components/ui";
import { OCCASIONS } from "@/lib/data/catalog";
import { PRICE_MAX, PRICE_MIN, parseShopQuery, searchProducts } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import type { Category } from "@/lib/types";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Shared view for /shop and /shop/[category]. Static header in the shell; results stream per request. */
export function ShopView({
  category,
  categories,
  searchParams,
}: {
  category?: Category;
  categories: Category[];
  searchParams: SP;
}) {
  const title = category?.shortName ?? "Shop all";
  const crumbs = [
    { label: "Home", href: "/" },
    ...(category ? [{ label: "Shop", href: "/shop" }, { label: category.shortName }] : [{ label: "Shop" }]),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: c.href ? absoluteUrl(c.href) : absoluteUrl(category ? `/shop/${category.slug}` : "/shop"),
          })),
        }}
      />
      <section className="wrap flex flex-col gap-3 pt-5 pb-2 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pt-9 lg:pb-5">
        <div className="flex flex-col gap-3 lg:gap-2.5">
          <Breadcrumbs items={crumbs} />
          <h1 className="enter font-display text-[40px] leading-[1.05] font-medium lg:text-[60px] lg:leading-none">{title}</h1>
          {category ? <p className="max-w-xl text-sm leading-relaxed text-cocoa lg:text-[15px]">{category.intro}</p> : null}
        </div>
        <Suspense fallback={<div className="hidden h-[50px] w-[400px] rounded-xl border border-line bg-white lg:block" />}>
          <DesktopSearchSlot searchParams={searchParams} />
        </Suspense>
      </section>

      <Suspense fallback={<ResultsSkeleton />}>
        <Results category={category} categories={categories} searchParams={searchParams} />
      </Suspense>

      <section className="wrap pb-12 lg:pb-20">
        <div className="reveal flex flex-col gap-3 rounded-2xl bg-sand px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:rounded-[18px] lg:px-11 lg:py-9">
          <div className="flex flex-col gap-2 lg:gap-2">
            <h2 className="font-display text-[26px] leading-[1.1] font-medium lg:text-[34px]">
              Want initials or a birthstone colour?
            </h2>
            <p className="text-sm leading-relaxed lg:text-base">Personalisation is free on every piece marked Customisable.</p>
          </div>
          <Link href="/custom" className="btn btn-primary shrink-0 !h-[46px] lg:!h-[54px]">
            Make it custom
          </Link>
        </div>
      </section>
    </>
  );
}

async function DesktopSearchSlot({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  return <DesktopSearch initial={q} />;
}

async function Results({ category, categories, searchParams }: { category?: Category; categories: Category[]; searchParams: SP }) {
  const sp = await searchParams;
  const query = parseShopQuery(sp, category?.slug);
  const { items, total, shown, page, hasMore } = await searchProducts(query);
  const chips = [{ slug: "all", label: "All" }, ...categories.map((c) => ({ slug: c.slug, label: c.shortName }))];

  const nextParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") nextParams.set(k, v);
  nextParams.set("page", String(page + 1));
  const base = category ? `/shop/${category.slug}` : "/shop";

  return (
    <>
      <ShopFilters
        state={{
          q: query.q,
          sub: query.sub ?? [],
          max: query.max,
          sale: !!query.sale,
          custom: !!query.custom,
          occasion: query.occasion,
          sort: query.sort,
        }}
        total={total}
        categories={chips}
        activeCategory={category?.slug}
        subcategories={category?.subcategories ?? []}
        occasions={OCCASIONS}
        priceMin={PRICE_MIN}
        priceMax={PRICE_MAX}
      />
      <div className="wrap">
        <div aria-hidden="true" className="mb-5 h-px bg-sand-2 lg:hidden" />
        <p className="sr-only" role="status" aria-live="polite">
          {total} {total === 1 ? "piece" : "pieces"} found
        </p>
      </div>

      {total > 0 ? (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              numberOfItems: total,
              itemListElement: items.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/product/${p.slug}`),
                name: p.name,
              })),
            }}
          />
          <p className="wrap -mt-1 mb-4 text-[13px] text-cocoa lg:mt-6 lg:mb-0 lg:text-sm">
            {total} {total === 1 ? "piece" : "pieces"}
          </p>
          <div className="wrap grid grid-cols-2 gap-x-3.5 gap-y-[26px] lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 lg:pt-6">
            {items.map((p, i) => (
              <div key={p.id} className={i >= (page - 1) * 12 ? "enter" : ""} style={{ ["--d" as string]: `${(i % 12) * 40}ms` }}>
                <ProductCard product={p} badge="custom" morph priority={i < 2} />
              </div>
            ))}
          </div>
          <div className="wrap flex flex-col items-center gap-3 pt-9 pb-11 lg:gap-3.5 lg:pt-12 lg:pb-14">
            <span className="text-[13px] lg:text-sm">
              Showing {shown} of {total}
            </span>
            <div aria-hidden="true" className="h-[3px] w-40 rounded-sm bg-sand-2 lg:w-[200px]">
              <div className="h-[3px] rounded-sm bg-brown transition-[width] duration-500" style={{ width: `${(shown / total) * 100}%` }} />
            </div>
            {hasMore ? (
              <Link
                href={`${base}?${nextParams.toString()}`}
                scroll={false}
                className="btn btn-outline mt-2 w-full lg:w-auto lg:!px-12"
              >
                Load more
              </Link>
            ) : null}
          </div>
        </>
      ) : (
        <div className="wrap flex flex-col items-center gap-4 pt-6 pb-14 text-center lg:gap-[18px] lg:pt-[72px] lg:pb-[88px]">
          <ArchFrame className="h-[200px] w-40 lg:h-[225px] lg:w-[180px]" bg="#F1EBE4" inset={8} />
          <h2 className="mt-2 font-display text-[32px] leading-[1.1] font-medium lg:text-5xl lg:leading-[1.05]">
            Can&apos;t find it? <em>Ash can make it.</em>
          </h2>
          <p className="max-w-[300px] text-[15px] leading-relaxed lg:max-w-[480px] lg:text-[17px]">
            Nothing matches those filters right now. Tell Ash what you&apos;re after and she&apos;ll make it to order.
          </p>
          <div className="mt-2 flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:gap-3.5">
            <Link href="/custom" className="btn btn-primary">
              Describe your idea
            </Link>
            <Link href={base} className="btn btn-outline lg:!px-7">
              Clear filters
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="wrap pt-4" aria-hidden="true">
      <div className="mb-6 hidden h-[118px] animate-pulse rounded-xl bg-sand-3 lg:block" />
      <div className="mb-6 h-[100px] animate-pulse rounded-xl bg-sand-3 lg:hidden" />
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-[26px] lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[4/5] animate-pulse rounded-[14px] bg-sand" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-sand" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
