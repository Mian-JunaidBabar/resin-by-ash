import { NextResponse, type NextRequest } from "next/server";
import { Pool } from "pg";
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieOptions } from "@/lib/session";

/**
 * Runs before the routes:
 *  - real 308 redirects for renamed category slugs (the page cache can't help here)
 *  - exposes the current path to server components for login redirects
 *  - slides a valid admin session forward once it has less than six days left
 */
let pool: Pool | undefined;

function db() {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function categoryRedirect(pathname: string) {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const result = await db().query<{ slug: string; parent_slug: string | null }>(
    `SELECT c.slug, p.slug AS parent_slug
       FROM "CategoryRedirect" r
       JOIN "Category" c ON c.id = r."categoryId"
       LEFT JOIN "Category" p ON p.id = c."parentId"
      WHERE r."fromPath" = $1
      LIMIT 1`,
    [path],
  );
  const row = result.rows[0];
  if (!row) return undefined;
  return row.parent_slug ? `/shop/${row.parent_slug}/${row.slug}` : `/shop/${row.slug}`;
}

async function sessionExpiry(token: string | undefined) {
  if (!token) return undefined;
  const result = await db().query<{ expiresAt: Date }>(`SELECT "expiresAt" FROM "Session" WHERE id = $1`, [token]);
  const expiresAt = result.rows[0]?.expiresAt;
  return expiresAt && expiresAt.getTime() > Date.now() ? expiresAt : undefined;
}

async function slideSession(request: NextRequest, response: NextResponse, expiresAt: Date) {
  const token = request.cookies.get(SESSION_COOKIE)!.value;
  const now = Date.now();
  const sixDays = 6 * 24 * 60 * 60 * 1000;
  if (expiresAt.getTime() > now && expiresAt.getTime() < now + sixDays) {
    const next = new Date(now + SESSION_MAX_AGE * 1000);
    await db().query(`UPDATE "Session" SET "expiresAt" = $1 WHERE id = $2`, [next, token]);
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/shop/")) {
    const target = await categoryRedirect(pathname).catch(() => undefined);
    if (target) return NextResponse.redirect(new URL(target, request.url), 308);
  }

  const headers = new Headers(request.headers);
  headers.set("x-rba-pathname", pathname);
  const response = NextResponse.next({ request: { headers } });

  const isAdminPage =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/invite");
  if (isAdminPage) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const expiresAt = await sessionExpiry(token).catch(() => undefined);
    if (!expiresAt) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login, 307);
    }
    await slideSession(request, response, expiresAt).catch(() => {});
  }

  return response;
}

export const config = {
  matcher: ["/shop/:path+", "/admin/:path*"],
};
