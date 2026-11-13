"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function signOut() {
  const session = await getSession();
  if (session) await db.session.delete({ where: { id: session.id } }).catch(() => {});
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
