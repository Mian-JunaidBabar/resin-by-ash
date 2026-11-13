/** Shared fallback for the dynamic shop/product shells. */
export function ShopPageSkeleton() {
  return (
    <div className="wrap pt-8 pb-16" aria-hidden="true">
      <div className="h-4 w-40 animate-pulse rounded bg-sand" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-sand" />
      <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded bg-sand" />
      <div className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-[26px] lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
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
