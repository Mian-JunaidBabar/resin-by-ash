"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email().max(200),
  role: z.enum(["OWNER", "DEVELOPER"]),
});

export async function inviteUser(formData: FormData) {
  const session = await requireAdmin();
  const parsed = schema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) redirect("/admin/settings/users?error=invalid");
  if (parsed.data.role === "OWNER" && session.user.role !== "OWNER") {
    redirect("/admin/settings/users?error=forbidden");
  }

  const email = parsed.data.email.toLowerCase();
  const token = randomBytes(32).toString("hex");

  await db.invite.deleteMany({ where: { email, usedAt: null } });
  await db.invite.create({
    data: {
      email,
      role: parsed.data.role,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  redirect(`/admin/settings/users?invite=${token}`);
}
