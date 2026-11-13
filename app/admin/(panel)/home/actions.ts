"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const text = z.string().trim().max(400);
const longText = z.string().trim().max(2000);

const homeSchema = z.object({
  heroEyebrow: text.min(1),
  heroHeadline: text.min(1),
  heroHeadlineEm: z.string().trim().max(120),
  heroSubcopy: longText,
  heroImageUrl: z.string().trim().max(500),
  primaryCtaLabel: text.min(1),
  primaryCtaHref: z.string().trim().max(300),
  secondaryCtaLabel: text.min(1),
  secondaryCtaHref: z.string().trim().max(300),
  flowerHeadline: text.min(1),
  flowerCopy: longText,
  flowerImageUrl: z.string().trim().max(500),
  seasonalHeadline: z.string().trim().max(200),
  seasonalImageUrl: z.string().trim().max(500),
  seasonalFrom: z.string().trim(),
  seasonalTo: z.string().trim(),
});

function iso(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/** Date input → start/end of that day in Pakistan (UTC+5). */
function day(value: string, end = false): Date | null {
  if (!value) return null;
  return new Date(`${value}T${end ? "23:59:59" : "00:00:00"}+05:00`);
}

export async function saveHome(formData: FormData) {
  await requireAdmin();
  const parsed = homeSchema.safeParse({
    heroEyebrow: iso(formData.get("heroEyebrow")),
    heroHeadline: iso(formData.get("heroHeadline")),
    heroHeadlineEm: iso(formData.get("heroHeadlineEm")),
    heroSubcopy: iso(formData.get("heroSubcopy")),
    heroImageUrl: iso(formData.get("heroImageUrl")),
    primaryCtaLabel: iso(formData.get("primaryCtaLabel")),
    primaryCtaHref: iso(formData.get("primaryCtaHref")),
    secondaryCtaLabel: iso(formData.get("secondaryCtaLabel")),
    secondaryCtaHref: iso(formData.get("secondaryCtaHref")),
    flowerHeadline: iso(formData.get("flowerHeadline")),
    flowerCopy: iso(formData.get("flowerCopy")),
    flowerImageUrl: iso(formData.get("flowerImageUrl")),
    seasonalHeadline: iso(formData.get("seasonalHeadline")),
    seasonalImageUrl: iso(formData.get("seasonalImageUrl")),
    seasonalFrom: iso(formData.get("seasonalFrom")),
    seasonalTo: iso(formData.get("seasonalTo")),
  });
  if (!parsed.success) redirect("/admin/home?error=1");
  const data = parsed.data;

  const steps = [0, 1, 2, 3].map((i) => ({
    title: iso(formData.get(`step.${i}.title`)).slice(0, 120),
    text: iso(formData.get(`step.${i}.text`)).slice(0, 400),
  }));

  await db.homeContent.update({
    where: { id: 1 },
    data: {
      heroEyebrow: data.heroEyebrow,
      heroHeadline: data.heroHeadline,
      heroHeadlineEm: data.heroHeadlineEm,
      heroSubcopy: data.heroSubcopy,
      heroImageUrl: data.heroImageUrl || null,
      primaryCtaLabel: data.primaryCtaLabel,
      primaryCtaHref: data.primaryCtaHref,
      secondaryCtaLabel: data.secondaryCtaLabel,
      secondaryCtaHref: data.secondaryCtaHref,
      flowerHeadline: data.flowerHeadline,
      flowerCopy: data.flowerCopy,
      flowerImageUrl: data.flowerImageUrl || null,
      seasonalHeadline: data.seasonalHeadline || null,
      seasonalImageUrl: data.seasonalImageUrl || null,
      seasonalFrom: day(data.seasonalFrom),
      seasonalTo: day(data.seasonalTo, true),
      steps,
    },
  });

  const reviewIds = formData.getAll("reviewIds").map(String);
  for (const [index, id] of reviewIds.entries()) {
    const caption = iso(formData.get(`reviewCaption_${id}`)).slice(0, 120) || "Customer";
    const imageUrl = iso(formData.get(`reviewImage_${id}`)).slice(0, 500);
    const sortOrder = Number(formData.get(`reviewOrder_${id}`));
    await db.review.update({
      where: { id },
      data: {
        caption,
        imageUrl: imageUrl || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : index,
        published: formData.get(`reviewPublished_${id}`) === "on",
      },
    });
  }

  const socialIds = formData.getAll("socialIds").map(String);
  for (const [index, id] of socialIds.entries()) {
    const label = iso(formData.get(`socialLabel_${id}`)).slice(0, 40) || "Post";
    const href = iso(formData.get(`socialHref_${id}`)).slice(0, 500);
    const imageUrl = iso(formData.get(`socialImage_${id}`)).slice(0, 500);
    const sortOrder = Number(formData.get(`socialOrder_${id}`));
    await db.socialTile.update({
      where: { id },
      data: {
        label,
        href,
        imageUrl: imageUrl || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : index,
      },
    });
  }

  updateTag("home");
  revalidateTag("home", "max");
  redirect("/admin/home");
}

async function swap(kind: "review" | "social", id: string, direction: "up" | "down") {
  if (kind === "review") {
    const current = await db.review.findUnique({ where: { id } });
    if (!current) return;
    const neighbour = await db.review.findFirst({
      where: { sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder } },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });
    if (!neighbour) return;
    await db.$transaction([
      db.review.update({ where: { id: current.id }, data: { sortOrder: neighbour.sortOrder } }),
      db.review.update({ where: { id: neighbour.id }, data: { sortOrder: current.sortOrder } }),
    ]);
  } else {
    const current = await db.socialTile.findUnique({ where: { id } });
    if (!current) return;
    const neighbour = await db.socialTile.findFirst({
      where: { sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder } },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });
    if (!neighbour) return;
    await db.$transaction([
      db.socialTile.update({ where: { id: current.id }, data: { sortOrder: neighbour.sortOrder } }),
      db.socialTile.update({ where: { id: neighbour.id }, data: { sortOrder: current.sortOrder } }),
    ]);
  }
  updateTag("home");
  revalidateTag("home", "max");
}

export async function moveReview(formData: FormData) {
  await requireAdmin();
  const [id, direction] = String(formData.get("move") ?? "").split(":");
  if (id && (direction === "up" || direction === "down")) await swap("review", id, direction);
  redirect("/admin/home");
}

export async function moveSocial(formData: FormData) {
  await requireAdmin();
  const [id, direction] = String(formData.get("move") ?? "").split(":");
  if (id && (direction === "up" || direction === "down")) await swap("social", id, direction);
  redirect("/admin/home");
}
