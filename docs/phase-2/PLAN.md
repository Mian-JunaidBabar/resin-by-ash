# Resin by Ash · Phase 2 plan (start to finish)

**For:** the coding agent that wires the finished frontend to a real backend.
**Goal:** a live store where Ash manages everything from the admin: categories (with their own SEO pages), products, home page content, orders, custom requests, customers and settings. Orders are saved before WhatsApp opens.
**Rule zero:** do not redesign. The UI in `app/`, `components/` and `docs/HANDOFF.md` is the spec. Only change visuals where a phase says so.

Read first, in this order: `AGENTS.md` (Next 16.4 differs from older versions; docs are in `node_modules/next/dist/docs/`), `docs/HANDOFF.md`, `lib/types.ts`, `lib/queries.ts`, `app/(store)/actions.ts`, `docs/phase-2/schema.prisma`.

---

## How to work through this plan

- Do the phases **in order**. Each phase ends with **Testing** and an **Exit gate**. Do not start the next phase until the gate passes.
- One phase = one branch + one PR. Small commits inside it.
- Before every commit: `npm run lint && npm run build`. From Phase 1 onward also `npm test`; from Phase 3 onward also `npm run test:e2e`.
- Never change the client contracts of `app/(store)/actions.ts` (input and return shapes). Replace bodies only.
- **Cache Components is on.** Anything that reads `cookies()`, `headers()`, `searchParams` or uncached DB data must sit under `<Suspense>`. Shared reads use `"use cache"` + `cacheLife` + `cacheTag`. Every admin write revalidates the tags it affects (table in Phase 2).
- Server is the source of truth for prices, totals and order numbers.
- Every admin page **and** every admin server action/route checks the session. A layout check alone is not enough.
- Leave no `TODO(phase 2)` in the code at the end (`grep -rn "TODO(phase 2)"` must be empty).

### Phase map

| # | Phase | Outcome |
| --- | --- | --- |
| 0 | Setup & tooling | Env, DB, test runners, CI |
| 1 | Data model & seed | Schema incl. dynamic categories, seeded from current catalogue |
| 2 | Read layer & dynamic category pages | Storefront reads from DB; every category/subcategory has its own SEO page |
| 3 | Home page from the database | Hero, category tiles, latest, best sellers, reviews editable |
| 4 | Admin auth | Login, sessions, roles, protection |
| 5 | Admin: catalogue (categories + products) | Full CRUD incl. category SEO fields, images, pins |
| 6 | Checkout & orders | Orders saved, WhatsApp message from template, admin order management |
| 7 | Custom requests, contact, customers, settings | Remaining admin screens live |
| 8 | SEO, performance, security hardening | Lighthouse budget, headers, analytics, error pages |
| 9 | UAT & launch | Client walkthrough, content, go-live checklist |

---

## Phase 0 · Setup & tooling

**Tasks**
1. Create `.env.example` with every variable below; load real values locally from `.env.local` (never commit it).

   | Var | Use |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL (Neon/Supabase/Railway) |
   | `AUTH_SECRET` | 32+ random bytes, signs sessions |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed the owner account (hashed at seed time) |
   | `CLOUDINARY_URL` *or* `BLOB_READ_WRITE_TOKEN` | Image storage |
   | `RESEND_API_KEY` (optional) | Email notifications |
   | `NEXT_PUBLIC_SITE_URL` | Canonical domain |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_DISPLAY` | Fallbacks until Settings is seeded |
2. Install: `prisma @prisma/client zod bcryptjs` (+ `cloudinary` or `@vercel/blob`), dev: `vitest @vitest/coverage-v8 @playwright/test @axe-core/playwright tsx`.
3. Scripts in `package.json`: `test` (vitest run), `test:e2e` (playwright test), `db:migrate`, `db:seed`, `db:reset`, `typecheck` (`next typegen && tsc --noEmit`).
4. Playwright config: two projects, `mobile` (390×844, `isMobile`) and `desktop` (1440×900); `webServer` runs `npm run build && npm start` against a **separate test database** (`DATABASE_URL_TEST`).
5. CI (GitHub Actions): Postgres service → migrate → seed → lint → typecheck → unit → build → e2e. Upload Playwright report on failure.
6. Move the current visual baseline into tests: capture Playwright screenshots of every storefront and admin page **before** touching data code (`tests/visual/baseline.spec.ts`, `toHaveScreenshot` with `maxDiffPixelRatio: 0.01`, motion reduced).

**Testing**
- `npm run lint`, `npm run typecheck`, `npm run build` pass on a clean clone.
- `npx playwright test tests/visual` passes and stores baselines for: `/`, `/shop`, `/shop/jewellery`, `/product/pressed-rose-earrings`, `/custom`, `/cart` (empty and with 2 items), `/thank-you`, `/about`, `/faq`, `/contact`, and all `/admin/**` screens, at both viewports.
- CI run is green on a PR.

**Exit gate:** baselines committed, CI green.

---

## Phase 1 · Data model & seed

**Categories are now dynamic.** Ash can create, rename, reorder, nest and hide categories from the admin, and each one gets its own indexable page with its own SEO content. Subcategories (Bangles, Earrings…) become real child categories with their own pages instead of filter strings.

**Tasks**
1. Copy `docs/phase-2/schema.prisma` → `prisma/schema.prisma`. Key points (already in the draft):
   - `Category` is a tree: `parentId` (null = top level). Fields: `slug` (unique per parent), `name`, `shortName`, `h1`, `intro`, `metaTitle`, `metaDescription`, `seoContent` (long text/markdown shown below the grid), `faq` (JSON `[{q,a}]`), `imageUrl` (arch tile), `ogImageUrl`, `showOnHome`, `showInFooter`, `sortOrder`, `status` (LIVE/HIDDEN).
   - `CategoryRedirect` (`fromPath`, `toCategoryId`) so renamed slugs 301 to the new URL.
   - `Product` has `categoryId` (required, any level) and inherits the parent chain for listing.
   - `HomeContent` / `HomeSection` and `Review` for Phase 3.
   - Everything else as drafted: variants, images, customers, orders, lines, events, requests, contact messages, delivery zones, settings, admin users.
2. Enable `pg_trgm` and add a GIN index on products for search (raw SQL migration): `to_tsvector('simple', name || ' ' || description)` + trigram on `name`.
3. Order numbers: Postgres sequence starting at **1047**, displayed as `{orderPrefix}{number}`.
4. `prisma/seed.ts` (idempotent, uses `upsert`):
   - Categories from `lib/data/catalog.ts`; each `subcategories[]` entry becomes a child category (`/shop/jewellery/earrings` etc.). Write starter SEO copy: `metaTitle = "{name} · Handmade resin in Pakistan"`, `metaDescription = seoDescription`, `h1 = shortName`.
   - Products, variants, `BEST_SELLER_ORDER` → `pinOrder`, product → child category by its `subcategory`.
   - FAQ (`lib/data/faq.ts`) → Settings JSON or its own table, delivery zones (`lib/delivery.ts`), Settings row from `lib/site.ts`, owner AdminUser from env, 6 placeholder reviews, home sections (Phase 3 shape).

**Testing**
- `npm run db:reset` (migrate + seed) runs twice in a row without errors (idempotent).
- Unit test `tests/unit/seed.test.ts` against the test DB: 6 top-level categories, 18 child categories, 27 LIVE + 1 DRAFT products, every product has a category, 5 delivery zones, 1 settings row, 1 admin user with a bcrypt hash (never the plain password).
- Query check: `SELECT nextval('order_number_seq')` returns ≥ 1047.

**Exit gate:** schema migrated, seed verified, ERD exported to `docs/phase-2/erd.png` (prisma-erd-generator or dbdiagram).

---

## Phase 2 · Read layer & dynamic category pages

**Tasks**
1. Rewrite `lib/queries.ts` on Prisma. Keep function names/return types and the `"use cache"` + `cacheLife` + `cacheTag` pattern. New/changed functions:
   - `getCategoryTree()` → top-level categories with children (LIVE only, `sortOrder`), tag `categories`.
   - `getCategoryByPath(parentSlug, childSlug?)` → category + breadcrumb chain, tag `category:{id}`.
   - `getCategoryStaticParams()` → all LIVE paths for `generateStaticParams` (**must return at least one item**, Cache Components rule).
   - `searchProducts(query)` → Postgres: full-text + trigram for `q`, includes products of child categories when filtering by a parent, same `ShopQuery` shape, `PAGE_SIZE = 12`. Synonyms (`nikah→nikkah`, `jewelry→jewellery`) from Settings.
   - `getSettings()` tag `settings`; `getDeliveryZones()` tag `delivery`.
   - Sale expiry: a sale counts only while `saleEndsAt` ≥ today in `Asia/Karachi`. Product reads use `cacheLife("hours")` so an expired sale disappears within the hour; document this in the code.
2. **Dedicated category routes** (replace the current single level):
   - `app/(store)/shop/[category]/page.tsx` → top-level category page.
   - `app/(store)/shop/[category]/[sub]/page.tsx` → child category page.
   - Both render `ShopView` with: `h1`, `intro`, the filtered grid (Suspense, as now), child-category chips (top level only), then the **SEO block** below the grid (`seoContent` + `faq` accordion), breadcrumbs.
   - `generateStaticParams` from `getCategoryStaticParams()`. Categories created later in the admin render on first request (App Shell + streamed grid) and are cached after; admin save calls `revalidateTag("categories")`.
   - `generateMetadata`: `metaTitle`, `metaDescription`, canonical `/shop/{path}` (filters never change the canonical), `openGraph.images` = `ogImageUrl` or the category tile, `robots: noindex` when the category is HIDDEN or has 0 live products.
   - JSON-LD per category page: `CollectionPage` + `BreadcrumbList` + `ItemList` (first page) + `FAQPage` (if `faq` present).
   - Unknown or HIDDEN slug → check `CategoryRedirect` → `permanentRedirect()` to the new path, otherwise `notFound()`.
   - Shop filter chips, home tiles and footer "Shop" links come from `getCategoryTree()` (footer uses `showInFooter`). The header stays Home / Shop / About / Contact.
   - Desktop "Type" select and mobile sheet "Category" chips become links to child category pages (keeps filters in the query string).
3. Product pages: breadcrumb shows the full chain (Home / Jewellery / Earrings / Product); `getRelated` prefers the same child category.
4. `app/sitemap.ts` from the DB: static pages, every LIVE category and child category (`lastModified` = latest product update in it), every LIVE product with image URLs. Split with `generateSitemaps` if products exceed 5,000.
5. Store layout search index and `ProductCard`/`ProductMedia` read DB fields (images[0] cover, images[1] hover).

**Revalidation map (used from Phase 5 on)**

| Write | Tags to revalidate |
| --- | --- |
| Category create/edit/reorder/hide | `categories`, `category:{id}`, `products` |
| Product create/edit/pin/archive | `products`, `product:{slug}`, `category:{id}` (old + new) |
| Settings / delivery zones | `settings`, `delivery` |
| Home content / reviews | `home` |
| Order status change | `orders` (best sellers use it) |

**Testing**
- Unit (Vitest, test DB): `searchProducts` cases: typo `"bangel"` finds bangles; `"nikah tray"` finds nikkah trays; parent filter includes child-category products; `max`, `sale`, `custom`, `occasion`, each `sort`, pagination `page=2` returns 24 total with `hasMore=false`; an expired sale is not "on sale".
- Unit: `getCategoryByPath` returns the breadcrumb chain; HIDDEN categories are excluded.
- E2E:
  1. Visual baselines from Phase 0 still match (data now from DB).
  2. `/shop/jewellery` shows child chips; clicking **Earrings** goes to `/shop/jewellery/earrings`, shows only earrings, `h1` = "Earrings".
  3. View source of `/shop/jewellery/earrings`: one `<h1>`, `<title>` = metaTitle, `meta description`, `link rel=canonical` = `/shop/jewellery/earrings` even with `?sale=1`, JSON-LD types `CollectionPage`, `BreadcrumbList`, `ItemList` present and parse as JSON.
  4. Create a category directly in the DB (test helper), call the revalidate helper, then `/shop/{new-slug}` returns 200 and appears in `/sitemap.xml`.
  5. Rename a slug in the DB with a `CategoryRedirect` row → old URL answers **308/301** to the new one.
  6. HIDDEN category → 404; category with 0 products → page has `noindex`.
- Manual: paste 2 category URLs and 1 product URL into Google Rich Results Test → no errors.

**Exit gate:** all of the above green; storefront visually unchanged.

---

## Phase 3 · Home page from the database

The home page at `/` (`app/(store)/page.tsx`) is built. This phase makes every section editable.

**Tasks**
1. `HomeContent` (single row) fields: hero eyebrow, headline (with an italic part), subcopy, hero image, primary/secondary CTA labels + links, flower-preservation section copy + image, custom-steps copy (4 items), seasonal hero (optional image + headline + `activeFrom`/`activeTo`, used Nov–Feb for wedding season).
2. Sections driven by data:
   - **Category tiles:** `getCategoryTree()` where `showOnHome`, in `sortOrder`, max 5 + the fixed "Custom Orders" tile.
   - **Latest arrivals:** products with `showInLatest = true` first, then newest, 8 items.
   - **Best sellers:** pinned (`pinOrder`) first, then units sold in CONFIRMED-or-later orders in the last 90 days, 8 items.
   - **Reviews:** `Review` rows (image = WhatsApp screenshot, caption "First name, City", `sortOrder`, `published`).
   - **Social tiles:** 6 rows in Settings (image, link, label Reel/Post/TikTok).
3. `getHomeContent()` cached with tag `home`; the page stays fully static apart from these cached reads (no Suspense needed).
4. Admin: new screen **Admin → Home page** (add to sidebar under Dashboard; reuse `Card`, `afield`, `abtnPrimary` styles — no new design language): edit hero, seasonal hero, flower section, steps, reorder/publish reviews, social tiles. Save → `revalidateTag("home")`.
5. Hero image uses `next/image` with `priority` and correct `sizes` (LCP element).

**Testing**
- E2E: change the hero headline in admin → `/` shows it after save (no redeploy). Set a seasonal hero with today inside its window → seasonal hero shows; outside the window → default hero.
- E2E: unpin all best sellers → order follows sales; pin one → it moves to the first slot.
- E2E: toggle `showOnHome` off for a category → its tile disappears from `/`.
- E2E: unpublish a review → it disappears from the carousel.
- Lighthouse mobile on `/`: LCP < 2.5 s with a real hero image; CLS < 0.05.
- Visual baseline for `/` updated only where content changed by test data.

**Exit gate:** home fully editable, Lighthouse passes on `/`.

---

## Phase 4 · Admin authentication

**Tasks**
1. `/admin/login` → server action: zod (email, password), bcrypt compare, create session row or signed JWT, set cookie `rba_session` (`httpOnly`, `secure` in prod, `sameSite=lax`, 7 days, sliding renewal).
2. `lib/auth.ts`: `getSession()`, `requireAdmin(role?)` (redirects to `/admin/login?next=…`), `signOut()`.
3. `app/admin/(panel)/layout.tsx`: wrap the shell in `<Suspense>` and call `requireAdmin()` inside (it reads cookies). Call `requireAdmin()` again at the top of **every** admin server action and admin route handler.
4. Throttle: 5 failed logins per 15 min per IP + email (DB table or Upstash).
5. Roles: `OWNER` (everything) and `DEVELOPER` (everything except deleting the owner). Settings → Admin users → **Invite**: one-time link (24 h) to set a password.
6. Sign out link in the sidebar clears the session.

**Testing**
- E2E: signed out, every `/admin/**` URL redirects to `/admin/login?next=…`; after login you land on `next`.
- E2E: wrong password 5× → 6th attempt blocked with a friendly message, even with the right password, until the window passes.
- Security test (Vitest or curl script): POST to an admin server action ID without a cookie → rejected (401/redirect), DB unchanged.
- Cookie flags checked in the Playwright response headers.
- Invite link works once, expires after 24 h.

**Exit gate:** no admin data or action reachable without a session.

---

## Phase 5 · Admin: catalogue (categories + products)

**Tasks**
1. **Categories screen** (existing design + SEO fields):
   - List as a tree (parents with indented children), drag to reorder (persist `sortOrder`), toggles `showOnHome` / `showInFooter`, status LIVE/HIDDEN.
   - Create/edit panel: name, slug (auto, editable, unique per parent), parent (none = top level), short name, H1, intro, arch tile image (4:5), **SEO**: meta title (counter, ≤ 60 chars), meta description (counter, ≤ 155), SEO content (markdown textarea with preview), FAQ items (add/remove), OG image. Show a live Google-snippet preview.
   - Slug change → create `CategoryRedirect` from the old path automatically.
   - Delete blocked while products or children exist (show count, offer "move products to…").
2. **Products screen:** server-side search/filter/pagination (20/page), pin toggle, status filter.
3. **Product edit/new** (existing design): zod rules → name 2–80; slug unique; category required (any level); price > 0; sale price must be < price (block); warn > 50% off; `saleEndsAt` ≥ today; variants (size/colour, `priceDelta` ≥ 0, swatch hex for colours); personalisation flags; occasions; lead time; status; pin + `pinOrder`; show in latest. Images: upload (jpg/png/webp/heic ≤ 8 MB, video mp4 ≤ 20 MB), auto 4:5 crop, drag reorder, delete, alt text. **Preview** opens the product page. **Archive** = status HIDDEN.
4. Uploads go through a server action or signed upload to Cloudinary/Blob; store `url`, `width`, `height`, `alt`. Add the host to `images.remotePatterns` in `next.config.ts`.
5. Every save revalidates per the map in Phase 2.

**Testing**
- E2E (desktop): create category "Gift Boxes" under top level with SEO fields → `/shop/gift-boxes` loads with that H1, meta title, description, SEO content and FAQ; appears in shop chips and sitemap; not on home until `showOnHome` is on.
- E2E: create child "Eid Boxes" under it → `/shop/gift-boxes/eid-boxes` works and breadcrumbs show both.
- E2E: rename "gift-boxes" → "gift-sets" → old URL redirects permanently; sitemap shows only the new URL.
- E2E: try to delete a category with products → blocked with a message.
- E2E: create a product with sale 1,200 on price 1,500 → storefront card shows strike, Rs 1,200 and -20%; set sale 1,600 → form error, nothing saved.
- E2E: upload 3 images, reorder → first image becomes the card cover; hover shows the second (desktop).
- Unit: zod schemas (valid + each invalid case), slugify, redirect creation on slug change.
- Accessibility: axe on all admin catalogue screens → 0 serious/critical.

**Exit gate:** Ash can run the whole catalogue alone; storefront updates within one request after save.

---

## Phase 6 · Checkout & orders

**Tasks**
1. `placeOrder` (keep its contract): zod → recompute prices from DB → one transaction: upsert `Customer` by normalised phone (`03XXXXXXXXX`), create `Order` (number from sequence, status NEW), `OrderLine` snapshots (name, options, personalisation JSON, unit price/was), first `OrderEvent` "Order placed on site".
2. WhatsApp message from `Settings.orderMessageTemplate` with placeholders `{order_id} {items_with_personalisation} {total} {name} {city} {address}`; 1,500-char cap kept. Use `Settings.whatsappNumber`.
3. Personalisation reference images: real upload from the product page (replace filename-only), URL saved on the cart line and order line.
4. Rate limits: 5 orders/phone/hour, 20/IP/hour; honeypot field on the cart form.
5. Thank-you page: keep sessionStorage; fallback fetch `GET /api/orders/{number}/public` (number, first name, line names/qty, totals only, no phone/address).
6. Optional: email Ash on each new order (Resend).
7. Admin **Orders**: server tabs with counts, search (number, name, phone), date range, pagination, CSV export route `GET /admin/orders/export.csv` (auth required).
8. Admin **Order detail**: status select → `updateOrderStatus` (adds `OrderEvent`, sets timestamps), private note autosave (debounced), progress photos upload (shown in timeline), `shipBy` date, "Open chat" uses the customer's real number, "Copy order" copies the saved message.
9. Dashboard: real stats (orders today, to make = CONFIRMED + IN_PROGRESS, month sales = CONFIRMED or later, COD collected = DELIVERED), Follow up list (NEW > 2 h, IN_PROGRESS with no progress photo, DELIVERED 3 days ago asking for review), Recent orders, Top sellers (30 days), Due this week (`shipBy`).

**Testing**
- Unit: `placeOrder` with tampered client prices → DB totals use server prices; unknown product → error; qty clamped 1–10; bad phone → error; message ≤ 1,500 chars.
- Unit: phone normaliser (`+92 300 1234567`, `0300-1234567`, `3001234567` → `03001234567`).
- E2E (mobile + desktop): add 2 items → cart → fill form → submit → `window.open` stubbed and called with a `wa.me/{number}?text=` URL containing the order number → thank-you shows the same number → order row exists with 2 lines and the Customer upserted → cart is empty.
- E2E: same phone orders twice → one Customer, two Orders.
- E2E: 6th order in an hour from one phone → blocked message.
- E2E admin: order appears as New on Orders + Dashboard; change to Confirmed → event added, counts update; CSV export downloads with the right columns.
- Load test (k6 or autocannon, staging): 20 concurrent orders → no duplicate order numbers, p95 action < 800 ms.

**Exit gate:** a real phone can place an order end to end and Ash sees it in admin.

---

## Phase 7 · Custom requests, contact, customers, settings

**Tasks**
1. `submitCustomRequest`: real image upload (up to 3), save `CustomRequest` (status NEW), keep the WhatsApp hand-off.
2. Admin **Custom requests**: server list with status filter, detail, `sendQuote` (amount + ready-by → saves, status QUOTED, opens WhatsApp with a quote template), Accept/Decline, `convertToOrder` (creates Order prefilled, links both ways).
3. `sendContactMessage`: save `ContactMessage`, optional email; admin gets a small "Messages" list (add under Custom requests using existing table styles).
4. Admin **Customers**: server search/pagination, tags (editable), order count/total spent/last order from aggregates, CSV export, "Open chat".
5. Admin **Settings**: save all cards (store & contact, announcement bar on/off + text, order prefix, default lead time, message template with placeholder validation, COD toggle, delivery zones CRUD + order, search synonyms, admin users). Storefront reads them via `getSettings()`; the cart's delivery charge and the FAQ delivery answer come from `getDeliveryZones()`.

**Testing**
- E2E: submit custom request with 2 images → appears in admin with images; send quote → status Quoted; convert → new Order linked.
- E2E: contact form → message listed in admin.
- E2E: change WhatsApp number in Settings → product page "Order on WhatsApp" link and cart hand-off use the new number.
- E2E: change Lahore delivery to Rs 300 → cart total updates for Lahore; FAQ answer shows Rs 300.
- E2E: turn announcement bar off → it disappears site-wide.
- Unit: message template validator rejects unknown placeholders.

**Exit gate:** no mock data left (`lib/data/admin.ts` deleted or test-only); every admin screen reads/writes the DB.

---

## Phase 8 · SEO, performance, security hardening

**Tasks**
1. Per-product OG image: `app/(store)/product/[slug]/opengraph-image.tsx` with `ImageResponse` (cover photo, name, price). Per-category OG falls back to the tile image.
2. Structured data review: Store (with real phone, `sameAs`), WebSite SearchAction, Product + Offer (`priceValidUntil` only during a sale, `availability` PreOrder/InStock), CollectionPage, BreadcrumbList, FAQPage.
3. `robots.ts`: disallow `/admin`, `/cart`, `/thank-you`, `/api`; filtered shop URLs stay crawlable but canonicalised.
4. Security headers in `next.config.ts`: CSP (self, image host, `wa.me` links, no inline scripts except Next's), `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. `noindex` header on `/admin`.
5. `error.tsx` for `(store)` and `admin/(panel)` in the existing style; `global-error.tsx`.
6. Analytics (GA4 or Vercel Analytics) with events: `view_item`, `add_to_cart`, `begin_checkout`, `place_order_whatsapp`, `custom_request_sent`, `search`. Cookie notice if GA4 is used.
7. Images: every product image has alt text (required in admin); `sizes` attributes checked; hero `priority`.
8. Database backups (daily) and a restore drill.

**Testing**
- Lighthouse CI (mobile, production build) on `/`, `/shop`, one category, one child category, one product: Performance ≥ 90, SEO = 100, Accessibility ≥ 95, Best Practices ≥ 95; LCP < 2.5 s, CLS < 0.05, INP < 200 ms.
- axe (Playwright) on every storefront page: 0 serious/critical.
- Rich Results Test: product, category, FAQ pages valid.
- `curl -I` shows security headers; CSP report-only for one day in staging before enforcing.
- Reduced motion: with `prefers-reduced-motion: reduce`, all content visible without scroll animations (Playwright `reducedMotion: 'reduce'`).
- Restore a backup into a scratch DB and boot the app against it.

**Exit gate:** budgets met; no console errors on any page.

---

## Phase 9 · UAT & launch

**Tasks**
1. Content: Ash uploads real photos (4:5), hero, category tiles, about + process photos, review screenshots (phone numbers blurred); replace every `[bracket]` placeholder (about story, studio hours, advance policy, reply time, food-safe trays, product sizes).
2. Domain + `NEXT_PUBLIC_SITE_URL`, HTTPS, `www` → apex redirect.
3. Google Search Console: verify, submit sitemap; Google Business Profile linked in `sameAs`.
4. Client walkthrough (recorded): add a category with SEO text, add a product with a sale, place a test order from a phone, move it through all statuses, send a quote.
5. Delete test orders/customers; reset the order sequence to 1047 if needed.

**Testing (UAT script, run by a human on a real Android phone + desktop)**
- Browse home → category → child category → product; search "bangle"; filter on sale; place an order with personalisation; confirm the WhatsApp message is complete and readable.
- Custom request with photos; contact message.
- Admin on a phone: confirm order, add progress photo, mark shipped, delivered.
- Check share previews (WhatsApp, Instagram DM) for home, a category and a product: image, title and description correct.

**Exit gate (definition of done):** CI green (lint, typecheck, unit, e2e, visual, Lighthouse), UAT script signed off by the client, no `TODO(phase 2)` in code, backups on, sitemap submitted.
