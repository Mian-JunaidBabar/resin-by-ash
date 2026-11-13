import { NextResponse, type NextRequest } from "next/server";
import { Pool } from "pg";

/**
 * Permanent redirects for renamed categories. This runs before the route cache,
 * so an old /shop/... URL always answers with a real 308 + Location header,
 * even if the old page was prerendered before the rename.
 */
let pool: Pool | undefined;

function db() {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function lookup(pathname: string) {
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

export async function proxy(request: NextRequest) {
  const target = await lookup(request.nextUrl.pathname).catch(() => undefined);
  if (!target) return NextResponse.next();
  return NextResponse.redirect(new URL(target, request.url), 308);
}

export const config = {
  matcher: ["/shop/:path+"],
};
