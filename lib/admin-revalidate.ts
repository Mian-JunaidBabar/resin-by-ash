import { revalidateTag, updateTag } from "next/cache";

/** Invalidate tags immediately (server actions) and mark them stale for other routes. */
export function invalidate(...tags: string[]) {
  for (const tag of tags) {
    updateTag(tag);
    revalidateTag(tag, "max");
  }
}
