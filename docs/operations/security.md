# Security headers

Headers are defined in `next.config.ts` and applied to every response.

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'`; Cloudinary/Vercel Blob images; `wa.me` form action; `'unsafe-inline'` styles/scripts required by Next.js; no framing |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation, payment and USB disabled |
| `X-Robots-Tag` | `noindex, nofollow` on `/admin/*`, `/cart`, `/thank-you` and `/api/*` |

`app/robots.ts` also disallows `/admin`, `/cart`, `/thank-you` and `/api`, and
points crawlers at `/sitemap.xml`.

## CSP report-only rehearsal

Before tightening CSP after a dependency change, run staging in report-only
mode for at least one day:

```bash
CSP_REPORT_ONLY=1 npm run build
CSP_REPORT_ONLY=1 npm run start
```

The header is then sent as `Content-Security-Policy-Report-Only`, so violations
appear in the browser console without blocking the page. Exercise the
storefront, WhatsApp checkout, admin login and image upload. Once the console is
clean, remove `CSP_REPORT_ONLY` and redeploy so the policy is enforced.

## Admin protection

Every admin page, server action and route handler calls `requireAdmin()`.
Sessions are opaque database rows in the `rba_session` cookie (`httpOnly`,
`sameSite=lax`, `secure` in production, seven-day sliding expiry). Login
attempts are throttled per IP and email, and invites are single-use and expire
after 24 hours.
