import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Internal revalidation endpoint. Used by the E2E suite (and available for
 * operational jobs); admin server actions call revalidateTag directly.
 * Requires the AUTH_SECRET bearer token.
 */
export async function POST(request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "Revalidation is not configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown; paths?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
  const paths = Array.isArray(body?.paths) ? body.paths.filter((p): p is string => typeof p === "string") : [];
  if (!tags.length && !paths.length) {
    return NextResponse.json({ error: "tags or paths is required" }, { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) revalidatePath(path, "page");
  return NextResponse.json({ revalidated: tags, paths });
}
