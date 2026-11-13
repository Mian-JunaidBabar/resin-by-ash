import { SITE } from "@/lib/site";

/** Admin session cookie (shared by the proxy and server actions). */
export const SESSION_COOKIE = "rba_session";
export const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: SITE.url.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
