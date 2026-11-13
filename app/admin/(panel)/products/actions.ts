"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidate } from "@/lib/admin-revalidate";
import { slugify } from "@/lib/slug";
import { productSchema, saleValidation } from "@/lib/catalogue-validation";
import { storeMedia } from "@/lib/uploads";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function karachiToday() {
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 5 * 60 * 60 * 1000);
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id") || undefined;
  const originalSlug = str(formData, "originalSlug");
  const back = `/admin/products/${originalSlug || "new"}`;
  const rawSale = str(formData, "salePrice");
  const rawPin = str(formData, "pinOrder");

  const parsed = productSchema.safeParse({
    name: str(formData, "name"),
    slug: str(formData, "slug") || undefined,
    categoryId: str(formData, "categoryId"),
    description: str(formData, "description"),
    details: str(formData, "details"),
    care: str(formData, "care"),
    price: str(formData, "price"),
    salePrice: rawSale || undefined,
    saleEndsAt: str(formData, "saleEndsAt") || undefined,
    status: str(formData, "status") || "DRAFT",
    leadTime: str(formData, "leadTime") || "5–7 working days",
    toneBg: str(formData, "toneBg") || "#F1EBE4",
    toneAccent: str(formData, "toneAccent") || "#E9B8BE",
    pinOrder: rawPin || undefined,
  });
  if (!parsed.success) redirect(`${back}?error=invalid`);
  const data = parsed.data;

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
  if (!category) redirect(`${back}?error=category`);

  const saleError = saleValidation(data.price, data.salePrice, data.saleEndsAt, karachiToday());
  if (saleError) redirect(`${back}?error=${saleError}`);
  const saleEndsAt = data.salePrice != null && data.saleEndsAt ? new Date(`${data.saleEndsAt}T23:59:59+05:00`) : null;

  const slug = slugify(data.slug || data.name);
  if (!slug) redirect(`${back}?error=slug`);
  const clash = await db.product.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) redirect(`${back}?error=slug`);

  const occasions = formData.getAll("occasions").map(String);
  const personalisation = formData.getAll("personalisation").map(String);
  const pinned = formData.get("pinnedBestSeller") === "on";
  const old = id ? await db.product.findUnique({ where: { id }, select: { slug: true, categoryId: true } }) : null;

  let pinOrder: number | null = null;
  if (pinned) {
    if (data.pinOrder != null) pinOrder = data.pinOrder;
    else {
      const last = await db.product.findFirst({ orderBy: { pinOrder: "desc" }, select: { pinOrder: true } });
      pinOrder = (last?.pinOrder ?? -1) + 1;
    }
  }

  const fields = {
    name: data.name,
    slug,
    categoryId: data.categoryId,
    description: data.description,
    details: data.details,
    care: data.care,
    price: data.price,
    salePrice: data.salePrice ?? null,
    saleEndsAt,
    customisable: formData.get("customisable") === "on",
    occasions,
    personalisation,
    leadTime: data.leadTime,
    toneBg: data.toneBg,
    toneAccent: data.toneAccent,
    pinnedBestSeller: pinned,
    pinOrder,
    showInLatest: formData.get("showInLatest") === "on",
    status: data.status,
  };

  const product = id
    ? await db.product.update({ where: { id }, data: fields })
    : await db.product.create({ data: fields });

  // Photos and videos: existing rows first (editable order/alt/remove), then new uploads.
  const imageIds = formData.getAll("imageId").map(String);
  for (const imageId of imageIds) {
    if (formData.get(`imageRemove_${imageId}`) === "on") {
      await db.productImage.delete({ where: { id: imageId } }).catch(() => {});
      continue;
    }
    const order = Number(formData.get(`imageOrder_${imageId}`));
    await db.productImage.update({
      where: { id: imageId },
      data: {
        alt: str(formData, `imageAlt_${imageId}`) || null,
        position: Number.isFinite(order) ? order : 0,
      },
    });
  }

  let position = (await db.productImage.count({ where: { productId: product.id } })) + 1;
  for (const file of formData.getAll("photos")) {
    if (!(file instanceof File) || !file.size) continue;
    try {
      const media = await storeMedia(file);
      await db.productImage.create({
        data: {
          productId: product.id,
          url: media.url,
          width: media.width ?? null,
          height: media.height ?? null,
          alt: file.name.replace(/\.[^.]+$/, "").slice(0, 160),
          position: position++,
        },
      });
    } catch (error) {
      redirect(`${back}?error=upload&message=${encodeURIComponent((error as Error).message)}`);
    }
  }
  const video = formData.get("video");
  if (video instanceof File && video.size > 0) {
    try {
      const media = await storeMedia(video);
      await db.productImage.create({
        data: { productId: product.id, url: media.url, isVideo: true, position: position++, alt: "Product video" },
      });
    } catch (error) {
      redirect(`${back}?error=upload&message=${encodeURIComponent((error as Error).message)}`);
    }
  }

  // Variants: simple fixed rows posted as parallel arrays.
  const kinds = formData.getAll("variantKind").map(String);
  const names = formData.getAll("variantName").map(String);
  const deltas = formData.getAll("variantDelta").map(String);
  const swatches = formData.getAll("variantSwatch").map(String);
  const variants: { kind: string; name: string; priceDelta: number; swatch: string | null; position: number }[] = [];
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i]?.trim();
    if (!name) continue;
    const kind = kinds[i] === "colour" ? "colour" : "size";
    const priceDelta = Number(deltas[i] || 0);
    const swatch = swatches[i]?.trim() || "";
    if (!Number.isInteger(priceDelta) || priceDelta < 0) redirect(`${back}?error=variant`);
    if (kind === "colour" && swatch && !/^#[0-9a-fA-F]{3,8}$/.test(swatch)) redirect(`${back}?error=variant`);
    variants.push({ kind, name, priceDelta, swatch: kind === "colour" && swatch ? swatch : null, position: variants.length });
  }
  await db.$transaction([
    db.productVariant.deleteMany({ where: { productId: product.id } }),
    db.productVariant.createMany({
      data: variants.map((v) => ({ ...v, productId: product.id })),
    }),
  ]);

  const tags = ["products", `product:${slug}`, `category:${data.categoryId}`];
  if (old) {
    tags.push(`product:${old.slug}`, `category:${old.categoryId}`);
  }
  invalidate(...tags);
  redirect(`/admin/products/${product.slug}?saved=1`);
}

export async function togglePin(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const product = await db.product.findUnique({ where: { id }, select: { id: true, slug: true, categoryId: true, pinnedBestSeller: true } });
  if (!product) redirect("/admin/products");
  const next = !product.pinnedBestSeller;
  let pinOrder: number | null = null;
  if (next) {
    const last = await db.product.findFirst({ orderBy: { pinOrder: "desc" }, select: { pinOrder: true } });
    pinOrder = (last?.pinOrder ?? -1) + 1;
  }
  await db.product.update({ where: { id }, data: { pinnedBestSeller: next, pinOrder } });
  invalidate("products", `product:${product.slug}`, `category:${product.categoryId}`, "orders");
  redirect("/admin/products");
}

export async function archiveProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const product = await db.product.findUnique({ where: { id }, select: { slug: true, categoryId: true } });
  if (!product) redirect("/admin/products");
  await db.product.update({ where: { id }, data: { status: "HIDDEN" } });
  invalidate("products", `product:${product.slug}`, `category:${product.categoryId}`);
  redirect("/admin/products");
}
