"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieOptions } from "@/lib/session";

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

// Compared against when the email is unknown, so both paths cost one bcrypt round.
const DUMMY_HASH = "$2b$12$OzS1VK/aTawqnElACB3IDOWlkaYAyVLyQndrqLOVVppBeWv.9ZTeS";

function safeNext(value: string | undefined): string {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

function fail(next: string, code: "invalid" | "credentials" | "throttled"): never {
  redirect(`/admin/login?error=${code}&next=${encodeURIComponent(next)}`);
}

export async function login(formData: FormData) {
  const next = safeNext(typeof formData.get("next") === "string" ? String(formData.get("next")) : undefined);
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) fail(next, "invalid");

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const requestHeaders = await headers();
  const ip = (requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? requestHeaders.get("x-real-ip") ?? "local").trim();
  const key = `${ip}|${email}`.slice(0, 300);
  const since = new Date(Date.now() - WINDOW_MS);

  const failures = await db.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } });
  if (failures >= MAX_FAILURES) fail(next, "throttled");

  const user = await db.adminUser.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await db.loginAttempt.create({ data: { key, success: false } });
    fail(next, "credentials");
  }

  await db.loginAttempt.deleteMany({ where: { key, success: false } });
  await db.loginAttempt.create({ data: { key, success: true } });

  const session = await db.session.create({
    data: { id: randomUUID(), userId: user.id, expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000) },
  });
  (await cookies()).set(SESSION_COOKIE, session.id, sessionCookieOptions());
  redirect(next);
}
