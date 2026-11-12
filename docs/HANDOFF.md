# Resin by Ash · Frontend handoff (phase 1)

Built from the Claude Design exports in `/extras` (Storefront mobile, Desktop storefront, Admin, Components).
Stack: **Next.js 16.4 (App Router, Cache Components, Turbopack) · React 19.3 · Tailwind CSS 4 · TypeScript**.
Read `AGENTS.md` first: this Next.js version differs from older training data; docs live in `node_modules/next/dist/docs/`.

```
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

Env (all optional in phase 1, see `lib/site.ts`):

| Var | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonicals, sitemap, OG, JSON-LD | `https://resinbyash.pk` (domain unconfirmed) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | wa.me target, digits only, e.g. `923001234567` | placeholder `920000000000` |
| `NEXT_PUBLIC_WHATSAPP_DISPLAY` | Number shown on Contact | `+92 3XX XXXXXXX` |

---

## 1. What is done vs stubbed

| Area | Status |
| --- | --- |
| All 9 storefront screens (mobile + desktop responsive) | Done, matches designs |
| 10 admin screens (dashboard, orders, order detail, products, product edit/new, categories, custom requests, customers, settings, login) | UI done, **mock data, no persistence** |
| Search (header overlay + shop search), filters, sort, load more | Done, server-side via `searchParams`, URL-shareable |
| Promo pricing (strike + calculated % pill) | Done (`lib/pricing.ts`) |
| Cart (localStorage) + WhatsApp checkout | Done; order **not saved** yet (server action stub) |
| Custom order form → WhatsApp | Done; request **not saved** yet |
| Contact form | Validates; **not saved/sent** yet |
| SEO: metadata, canonicals, OG/Twitter image, sitemap, robots, manifest, icons, JSON-LD | Done |
| Animations (entrance, scroll reveal, sheen, view transitions, sheets, accordions) | Done, reduced-motion safe |
| Product photos | **Placeholder art** (`ResinArt`) until real photos are uploaded |
| Auth for /admin | **Not done** (phase 2) |

Header navigation is **Home · Shop · About · Contact** (`NAV_LINKS` in `lib/site.ts`); categories are reached from the home tiles, shop chips and footer. The home page lives at `app/(store)/page.tsx` and serves `/`.

Anything in `[square brackets]` in the UI is client copy to confirm (about story, studio hours, advance policy, reply time, food-safe trays, sizes).

---

## 2. File map

```
app/
  layout.tsx                 root: fonts (self-hosted from the design export), global metadata, viewport
  globals.css                design tokens (@theme), components (.btn .field .chip .wrap .arch), motion
  (store)/layout.tsx         header, footer, WhatsApp FAB, Store + WebSite JSON-LD, route view transition
  (store)/page.tsx           Home
  (store)/shop/page.tsx      Shop all          → components/store/shop-view.tsx
  (store)/shop/[category]/   Category pages    → same view
  (store)/product/[slug]/    Product detail    → gallery.tsx, product-purchase.tsx
  (store)/custom/            Custom order      → custom-form.tsx
  (store)/cart/              Cart + checkout   → cart-view.tsx
  (store)/thank-you/         Thank you         → thank-you-view.tsx
  (store)/contact|about|faq/ Static pages
  (store)/actions.ts         SERVER ACTIONS: placeOrder, submitCustomRequest, sendContactMessage (phase-2 seams)
  admin/login/               Sign in (not in design set, built in style)
  admin/(panel)/...          Admin screens (sidebar layout)
  sitemap.ts robots.ts manifest.ts opengraph-image.jpg icon.png apple-icon.png
components/
  ui.tsx                     ResinArt, ProductMedia, Price, ProductCard, SectionHead, ArchFrame, Breadcrumbs, JsonLd
  icons.tsx                  line icons from the design
  store/*                    storefront client/server pieces
  admin/*                    admin pieces
lib/
  site.ts                    site config (moves to Settings table in phase 2)
  types.ts                   domain types (map 1:1 to DB tables)
  queries.ts                 READ LAYER, "use cache" + cacheTag → swap bodies for DB queries
  pricing.ts delivery.ts whatsapp.ts cart.ts
  data/catalog.ts            seed products + categories (becomes the DB seed)
  data/admin.ts faq.ts       mock admin data, FAQ copy
```

**Rule for phase 2:** pages never import `lib/data/*` directly except admin mocks and `generateStaticParams`/`sitemap`. Replace those with queries too.

---

## 3. Design tokens

All in `app/globals.css` `@theme` → Tailwind classes (`bg-cream`, `text-brown`, `border-line`...).

| Token | Value | Usage |
| --- | --- | --- |
| `cream` | #FBF9F6 | page background, chips on photos |
| `sand` | #F1EBE4 | bands, announcement bar, admin sidebar, summary boxes |
| `sand-2` | #ECE5DE | hairlines, alt placeholder tone |
| `sand-3` | #F6F2ED | price box, selected rows |
| `line` | #E2D8CE | input/chip borders, inactive dots |
| `brown` | #463229 | text, footer bg, selected chip |
| `cocoa` | #7A6455 | secondary text |
| `muted` | #9A8F8C | struck-through price |
| `caramel` / `caramel-dark` | #9E6842 / #87563A | primary CTA / hover |
| `gold` | #C9A45C | hairlines, discount pill border, step rings, arch inner line |
| status pills | `st-*-bg/fg` | New, Confirmed, In progress, Shipped, Delivered, Cancelled |

Type: **Cormorant Garamond** (display, 500/600, italic 500 for `<em>`), **DM Sans** (UI/body 400–700).
Scale (mobile → desktop): H1 hero 46→84px, page H1 40–42→60–72px, H2 32→48px, card title 19→23px, body 15→17–18px, eyebrow 12→13px uppercase 0.14–0.16em.
Radii: fields/buttons 12px, cards 14→16px, panels 16–18px, pills 999px. Arch = `50cqw` top radius via `.arch-wrap/.arch` (container units).
Gutter (`.wrap`): 20px <768, 40px 768–1279, 120px ≥1280, max 1440px.

## 4. Components and states

| Component | States / behaviour |
| --- | --- |
| `.btn-primary` | hover caramel-dark, active scale .98, `disabled` 55% opacity; heights 48 (mobile) / 54 (≥1024) |
| `.btn-outline` | hover sand bg |
| `.chip` | default white/line; `aria-current=page` or `aria-pressed=true` → brown fill |
| `ProductCard` | image zoom on hover, "View piece" bar slides up (≥1024), title turns caramel; badge "Best seller" or "Customisable" |
| `Price` | regular only, or strike + bold + `-N%` gold pill (screen reader says "Was … now …") |
| Product size/colour | `role=radio`, selected = brown fill / brown ring |
| Personalisation | only fields enabled on the product; file input shows chosen filename |
| Add to cart | → "Added · View cart"; header badge bumps |
| Shop filters | mobile bottom-sheet `<dialog>` (`closedby="any"`), desktop inline bar; active chips removable; "Clear all" |
| Empty shop | arch + "Can't find it? Ash can make it." + Describe your idea / Clear filters |
| Cart | empty state, hydration placeholder, inline field errors from server action, "Saving your order…" |
| Search overlay | suggestions → live results ≥2 chars → no-results custom-order CTA; Enter goes to `/shop?q=` |
| Carousels | native scroll-snap; desktop prev/next (disabled at ends); mobile 4-bar indicator; polite status |
| Accordions | `<details class="acc">` animated height via `::details-content` (progressive) |

## 5. Motion

| Element | Trigger | Animation | Duration / easing |
| --- | --- | --- | --- |
| `.enter` (hero copy, titles) | load | fade + rise 18px, staggered by `--d` | 800ms `--ease-out-soft` |
| `.reveal`, `.reveal-stagger > *` | scroll into view | rise, scroll-driven (`animation-timeline: view()`) | entry 0–55% |
| `.sheen` (hero/about arches) | loop | light sweep | 6.5s, 1.2s delay |
| `.float` dots | loop | 6px drift | 6s |
| WhatsApp FAB | load | rise + 2 pings | 900ms delay |
| Route change | navigation | old fade out / new rise (React `<ViewTransition default="page">`) | 180 / 320ms |
| Card → product hero | navigation from shop grid | shared-element morph (`product-{slug}`) | 450ms |
| Sheets/dialogs | open/close | slide + backdrop fade (`@starting-style`, `allow-discrete`) | 350ms |

All spatial motion lives inside `@media (prefers-reduced-motion: no-preference)`; static state is the final state.

## 6. Accessibility notes

Skip link; one `h1` per page; labelled landmarks/navs; breadcrumbs with `aria-current`; dialogs are native `<dialog>` with `showModal()` (focus trap + Esc); all icon buttons have `aria-label`; 44px min touch targets; form errors use `aria-invalid` + `aria-describedby`; live regions for cart totals, carousel status and result counts; focus ring = 2px caramel.

## 7. Design critique (things to raise with the client)

| Finding | Severity | Recommendation |
| --- | --- | --- |
| No real photography yet; placeholders carry the whole look | High | Shoot 4:5 photos on cream/linen before launch. Upload via admin; `ProductMedia` swaps automatically |
| Reviews are empty screenshot slots | High | Pull 6 screenshots from the IG "reviews" highlight (blur phone numbers) |
| Price contrast: `muted` #9A8F8C on cream ≈ 3.1:1 | Medium | Fine for struck "was" price (decorative, the real price is bold brown) but don't reuse `muted` for body text |
| Admin "Recent orders" status column clips at mid widths (also in the design) | Low | Table scrolls horizontally; consider dropping City column under 1280px |
| Product page has no desktop design | Low | Built as gallery (sticky) + info column; review with client |
| Login screen not designed | Low | Built in the same style |

---

## 8. Placeholders the client must supply

WhatsApp number · domain · real product list, prices, sizes and photos · hero, category tile, about and process photos · review screenshots · studio hours · advance policy for big custom orders · reply time · food-safe trays · delivery charges confirmation · logo vector.
