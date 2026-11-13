"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z
  .object({
    token: z.string().min(10).max(200),
    name: z.string().trim().min(2).max(80),
    password: z.string().min(8).max(200),
    confirm: z.string().min(8).max(200),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"] });

export async function acceptInvite(formData: FormData) {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) redirect(`/admin/invite/${String(formData.get("token") ?? "")}?error=invalid`);

  const invite = await db.invite.findUnique({ where: { token: parsed.data.token } });
  if (!invite || invite.usedAt || invite.expiresAt <= new Date()) {
    redirect(`/admin/invite/${parsed.data.token}?error=expired`);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.$transaction([
    db.adminUser.upsert({
      where: { email: invite.email },
      update: { passwordHash, role: invite.role },
      create: { email: invite.email, name: parsed.data.name, role: invite.role, passwordHash },
    }),
    db.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/admin/login?ready=1");
}
