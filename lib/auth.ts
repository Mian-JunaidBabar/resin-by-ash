import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";

export type AdminRole = "OWNER" | "DEVELOPER";

export type AdminSession = {
  id: string;
  expiresAt: Date;
  user: { id: string; email: string; name: string; role: AdminRole };
};

/** Current admin session, memoised for the request. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({ where: { id: token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
});

/**
 * Guard for admin pages, server actions and route handlers. The proxy adds the
 * current pathname header so a signed-out visitor is sent back to where they
 * were trying to go.
 */
export async function requireAdmin(role?: AdminRole): Promise<AdminSession> {
  const session = await getSession();
  if (!session) {
    const path = (await headers()).get("x-rba-pathname") || "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(path.startsWith("/admin") ? path : "/admin")}`);
  }
  if (role && session.user.role !== role) {
    redirect("/admin?error=forbidden");
  }
  return session;
}
