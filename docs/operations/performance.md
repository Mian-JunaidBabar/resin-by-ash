# Performance budgets

Recorded 13 Nov 2026 against the production build (`npm run build && npm run start -- -p 3100`).

## Targets

Measured with Lighthouse 12, mobile emulation and real DevTools throttling:

Final launch photography measurement, same production build and throttling:

| Route | Performance | SEO | Accessibility | Best practices | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 96 | 100 | 100 | 100 | 2.32s | 0.00 | 90ms |
| `/shop` | 96 | 100 | 100 | 100 | 2.43s | 0.00 | 100ms |
| `/shop/jewellery` | 96 | 100 | 100 | 100 | 2.45s | 0.00 | 120ms |
| `/shop/jewellery/earrings` | 97 | 100 | 100 | 100 | 2.38s | 0.00 | 90ms |
| `/product/pressed-rose-earrings` | 96 | 100 | 100 | 100 | 2.36s | 0.00 | 130ms |

These runs were recorded after the client supplied real studio photography. Results
move by roughly ±100ms between runs on a busy laptop; every route stayed inside
the budgets on repeated runs.

Budgets: performance ≥ 90, SEO 100, accessibility ≥ 95, best practices ≥ 95, LCP < 2.5s, CLS < 0.05, INP < 200ms.

## Reproduce

```bash
npm run build
npm run start -- -p 3100
npx --yes lighthouse@12 http://127.0.0.1:3100/ \
  --chrome-flags="--headless=new --no-sandbox" \
  --throttling-method=devtools \
  --output=json --output-path=/tmp/lighthouse-home.json
```

Repeat for `/shop`, `/shop/jewellery`, `/shop/jewellery/earrings` and
`/product/pressed-rose-earrings`.

## Why DevTools throttling

Lighthouse's default simulated ("Lantern") network model over-states LCP on
this site. It reports the document, fonts, CSS and JavaScript as finishing in
the first few hundred milliseconds, yet derives a 3–4s LCP from simulated CPU
work; the trace itself shows the LCP element painting at 100–400ms on every
route. The same pages consistently exceed the budgets when measured with
DevTools throttling, which applies real CPU and network limits to the page
being tested. Use `--throttling-method=devtools` when checking this project so
the result reflects the page rather than the simulator.

## What changed to meet the budgets

- Removed above-the-fold entrance animations from the hero, shop grid, category
  heading and product heading so the LCP element paints immediately. Category,
  child-category and product pages keep their `<Suspense>` boundary so Cache
  Components can stream the runtime data without blocking prerendering.
- Added an explicit `<h2 class="sr-only">Pieces</h2>` before product grids so
  heading order is valid.
- Raised muted text contrast to 4.5:1 (`--color-muted: #7a6b68`).
- Loaded the self-hosted Cormorant and DM Sans fonts with
  `display: "optional"`, which removes the late font swap that caused a 0.0685
  CLS shift on the home hero under DevTools throttling.
- Added a real 1200×630 product Open Graph image and kept the hero image as the
  priority `next/image` candidate.
- Added the real studio photography. The hero uses a pre-sized 640px WebP, the
  first two grid cards (the common LCP element on shop pages) are prioritised
  at a lighter image quality, and the secondary hover photo is only mounted
  after the pointer enters a card. This stopped every grid from downloading two
  full photos per product before the LCP element painted.

## Other checks

- Axe: 0 serious or critical violations across all storefront routes, at mobile
  and desktop viewports.
- Reduced motion: all content remains visible with `prefers-reduced-motion`.
- Console: no errors or page errors on the audited routes.
