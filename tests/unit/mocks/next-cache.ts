/** No-op cache primitives for unit tests (the real ones need the Next runtime). */
export const cacheLife = () => {};
export const cacheTag = () => {};
export const revalidateTag = () => {};
export const revalidatePath = () => {};
export const unstable_cache = <T>(fn: T) => fn;
export const unstable_noStore = () => {};
