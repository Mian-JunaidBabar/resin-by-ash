"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { validateOrderTemplate } from "@/lib/settings-validation";

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

function parseHours(value: string): string {
  const rows = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [days, ...rest] = line.split("|");
      return { days: days.trim(), hours: rest.join("|").trim() };
    })
    .filter((row) => row.days && row.hours);
  return JSON.stringify(rows);
}

function parseSynonyms(value: string): Record<string, string> {
  const synonyms: Record<string, string> = {};
  for (const line of value.split("\n")) {
    const [from, ...rest] = line.split("=");
    const key = from?.trim().toLowerCase();
    const to = rest.join("=").trim().toLowerCase();
    if (key && to) synonyms[key] = to;
  }
  return synonyms;
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const whatsappNumber = text(formData.get("whatsappNumber")).replace(/\D/g, "");
  const template = text(formData.get("orderMessageTemplate"));

  if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
    redirect("/admin/settings?error=whatsapp");
  }
  const valid = validateOrderTemplate(template);
  if (!valid.ok) {
    redirect(`/admin/settings?error=template&message=${encodeURIComponent(valid.error)}`);
  }
  const prefix = text(formData.get("orderPrefix")).slice(0, 12);
  if (!prefix || /\s/.test(prefix)) redirect("/admin/settings?error=prefix");

  await db.settings.update({
    where: { id: 1 },
    data: {
      whatsappNumber,
      whatsappDisplay: text(formData.get("whatsappDisplay")).slice(0, 60) || `+${whatsappNumber}`,
      instagram: text(formData.get("instagram")).slice(0, 300),
      tiktok: text(formData.get("tiktok")).slice(0, 300),
      studioHours: parseHours(text(formData.get("studioHours"))),
      announcementOn: formData.get("announcementOn") === "on",
      announcement: text(formData.get("announcement")).slice(0, 240),
      orderPrefix: prefix,
      defaultLeadTime: text(formData.get("defaultLeadTime")).slice(0, 80) || "5–7 working days",
      orderMessageTemplate: template,
      acceptCod: formData.get("acceptCod") === "on",
      searchSynonyms: parseSynonyms(text(formData.get("searchSynonyms"))),
    },
  });

  updateTag("settings");
  revalidateTag("settings", "max");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function saveZone(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const label = text(formData.get("label")).slice(0, 80);
  const cities = text(formData.get("cities"))
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean)
    .slice(0, 50);
  const charge = Math.max(0, Math.floor(Number(text(formData.get("charge")).replace(/\D/g, "")) || 0));
  const days = text(formData.get("days")).slice(0, 40) || "3–5";
  const position = Math.max(0, Math.floor(Number(text(formData.get("position"))) || 0));
  if (!label || cities.length === 0) redirect("/admin/settings?error=zone");

  if (id) {
    await db.deliveryZone.update({ where: { id }, data: { label, cities, charge, days, position } });
  } else {
    const count = await db.deliveryZone.count();
    await db.deliveryZone.create({ data: { label, cities, charge, days, position: count } });
  }

  updateTag("delivery");
  revalidateTag("delivery", "max");
  revalidatePath("/admin/settings");
  revalidatePath("/cart");
  revalidatePath("/faq");
  redirect("/admin/settings?saved=zones");
}

export async function moveZone(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const direction = text(formData.get("direction"));
  const zones = await db.deliveryZone.findMany({ orderBy: [{ position: "asc" }, { label: "asc" }] });
  const index = zones.findIndex((zone) => zone.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= zones.length) redirect("/admin/settings");

  await db.$transaction(
    zones.map((zone, i) =>
      db.deliveryZone.update({
        where: { id: zone.id },
        data: { position: i === index ? swapWith : i === swapWith ? index : i },
      }),
    ),
  );
  updateTag("delivery");
  revalidateTag("delivery", "max");
  revalidatePath("/admin/settings");
  revalidatePath("/cart");
  revalidatePath("/faq");
  redirect("/admin/settings?saved=zones");
}

export async function deleteZone(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  if (!id) redirect("/admin/settings");
  await db.deliveryZone.delete({ where: { id } });
  const zones = await db.deliveryZone.findMany({ orderBy: [{ position: "asc" }, { label: "asc" }] });
  await db.$transaction(zones.map((zone, i) => db.deliveryZone.update({ where: { id: zone.id }, data: { position: i } })));
  updateTag("delivery");
  revalidateTag("delivery", "max");
  revalidatePath("/admin/settings");
  revalidatePath("/cart");
  revalidatePath("/faq");
  redirect("/admin/settings?saved=zones");
}
