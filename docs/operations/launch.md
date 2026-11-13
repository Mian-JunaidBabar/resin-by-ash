# Launch checklist and UAT

Last updated: 13 November 2026

## What is ready

- Real 4:5 studio photography is used for the home hero, flower-preservation
  panel, category tiles, about page and process cards, social tiles, and two
  images per product (`public/images/studio/`).
- The three process photos are the POUR, CURE and POLISH shots supplied by Ash.
- About copy, product dimensions, custom-order payment policy, delivery answer
  and food-safety answer no longer contain bracketed placeholders.
- The home editor can upload new hero, flower, seasonal, review and social
  images directly. Review screenshots can also be pasted as URLs.
- `NEXT_PUBLIC_GOOGLE_BUSINESS_URL` is included in the Store `sameAs` list when
  set.
- `npm run db:clear-test-data` deletes test orders, customers, custom requests
  and contact messages, then resets the order sequence so the next order is
  `RBA-1047`. It refuses to run without `CONFIRM_CLEAR_TEST_DATA=YES`.
- `npm run db:backup` and `npm run db:restore-drill` are documented in
  `backups.md`; the daily GitHub Actions backup workflow is in
  `.github/workflows/backup.yml`.
- Lighthouse budgets and security headers are recorded in `performance.md` and
  `security.md`.

## Before go-live (owner or hosting action)

- [ ] Put the real studio WhatsApp number in `NEXT_PUBLIC_WHATSAPP_NUMBER`
      (international format, no `+` or spaces) and a friendly display value in
      `NEXT_PUBLIC_WHATSAPP_DISPLAY`. Also set the same number in
      **Admin → Settings → Store & contact**.
- [ ] Upload review screenshots in **Admin → Home → Reviews**. Blur customer
      phone numbers before uploading. Until then the home page shows a designed
      “Shared on WhatsApp” card rather than a fake testimonial.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production origin. The code falls back to
      `https://resinbyash.pk`.
- [ ] Point DNS at the host, enable HTTPS, and redirect `www` to the apex domain.
- [ ] Set `NEXT_PUBLIC_GOOGLE_BUSINESS_URL` after the Business Profile is
      verified, so Store structured data links to it.
- [ ] Add `PRODUCTION_DATABASE_URL` as a GitHub Actions secret for daily backups.
- [ ] Verify the domain in Google Search Console, submit
      `https://<domain>/sitemap.xml`, and confirm `robots.txt` points at it.
- [ ] Take a production backup, then run
      `CONFIRM_CLEAR_TEST_DATA=YES npm run db:clear-test-data` once the real
      catalogue is loaded and test orders are no longer needed.
- [ ] Record the client walkthrough while completing the admin walkthrough
      below.

## Client walkthrough (record this)

1. **Admin → Categories**: create `Gift Boxes` with a meta title, meta
   description and SEO paragraph. Confirm `/shop/gift-boxes` loads and appears
   in the sitemap.
2. **Admin → Products**: add a test product with three photos and a sale price.
   Confirm the sale badge and strike-through price on the shop card.
3. **Phone**: place an order with a name, date and reference photo. Open the
   WhatsApp hand-off and confirm every line, the total, the city and the address
   are readable.
4. **Admin → Orders**: move the order New → Confirmed → In progress → Shipped →
   Delivered. Add a progress photo and a private note.
5. **Admin → Requests**: open the test custom request, send a quote, then convert
   it to an order and show the linked order.
6. **Admin → Home**: change the hero headline, save, and refresh the storefront.
7. **Admin → Settings**: change the announcement, save, and show it site-wide.
   Change it back.

## UAT script (human, real Android phone + desktop)

Mark each line only after testing the production URL, not localhost.

### Storefront

- [ ] Home → Nikkah → Trays → a product page; breadcrumbs and related products
      are correct.
- [ ] Search `bangle`; results include the bangle products.
- [ ] Apply the **On sale** filter; every result shows a sale price.
- [ ] Open a customisable product, add names/date and a reference image, then
      place the order.
- [ ] The WhatsApp message contains the order number, every item with
      personalisation, delivery charge, total, name, city and address.
- [ ] Submit a custom request with two photos; the success panel and WhatsApp
      hand-off appear.
- [ ] Send a contact message; it appears in **Admin → Requests → Messages**.
- [ ] Change the Lahore delivery charge in Settings; the cart total and the FAQ
      delivery answer both update.
- [ ] Turn the announcement off; it disappears from every storefront page.
- [ ] With reduced motion enabled, all headings, images and buttons remain
      visible.

### Admin on a phone

- [ ] Sign in; every admin section is reachable.
- [ ] Confirm a new order.
- [ ] Add a progress photo.
- [ ] Mark the order Shipped, then Delivered.
- [ ] Open the customer chat link and confirm the number is correct.

### Share previews

- [ ] Paste the home URL into WhatsApp and an Instagram DM; image, title and
      description are correct.
- [ ] Repeat for a category and a product.
- [ ] Product preview price matches the live price, including a sale.

### Sign-off

- [ ] CI is green: lint, typecheck, unit, E2E, visual, Lighthouse.
- [ ] No `TODO(phase 2)` remains in application code.
- [ ] Daily backups are running and a restore drill has passed.
- [ ] Sitemap is submitted and Search Console shows no coverage errors.
- [ ] Client signs and dates: ______________________________
