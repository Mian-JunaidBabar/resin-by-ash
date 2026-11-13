"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidate } from "@/lib/admin-revalidate";
import { slugify } from "@/lib/slug";
import { categoryPath, categorySchema } from "@/lib/catalogue-validation";
import { storeMedia } from "@/lib/uploads";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function uniqueSiblingSlug(slug: string, parentId: string | null, ignoreId?: string) {
  const clash = await db.category.findFirst({
    where: { slug, parentId, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
    select: { id: true },
  });
  return !clash;
}

function fullPath(category: { slug: string; parent: { slug: string } | null }) {
  return categoryPath(category.slug, category.parent?.slug);
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id") || undefined;
  const parentIdRaw = str(formData, "parentId");
  const parentId = parentIdRaw || null;

  const parsed = categorySchema.safeParse({
    name: str(formData, "name"),
    shortName: str(formData, "shortName"),
    slug: str(formData, "slug") || undefined,
    parentId: parentIdRaw,
    h1: str(formData, "h1") || undefined,
    intro: str(formData, "intro"),
    metaTitle: str(formData, "metaTitle"),
    metaDescription: str(formData, "metaDescription"),
    seoContent: str(formData, "seoContent"),
    imageUrl: str(formData, "imageUrl") || undefined,
    ogImageUrl: str(formData, "ogImageUrl") || undefined,
    tone: str(formData, "tone") || "#F1EBE4",
    status: str(formData, "status") === "HIDDEN" ? "HIDDEN" : "LIVE",
    sortOrder: str(formData, "sortOrder") || "0",
    showOnHome: formData.get("showOnHome") === "on",
    showInFooter: formData.get("showInFooter") === "on",
  });
  const back = `/admin/categories/${id ?? "new"}`;
  if (!parsed.success) redirect(`${back}?error=invalid`);
  const data = parsed.data;

  if (id && parentId === id) redirect(`${back}?error=parent`);
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
    if (!parent) redirect(`${back}?error=parent`);
    if (parent.parentId) redirect(`${back}?error=parent`); // only one level of nesting
  }

  const slug = slugify(data.slug || data.name);
  if (!slug) redirect(`${back}?error=slug`);
  if (!(await uniqueSiblingSlug(slug, parentId, id))) redirect(`${back}?error=slug`);

  let imageUrl = data.imageUrl || null;
  const photo = formData.get("imageFile");
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = (await storeMedia(photo)).url;
    } catch (error) {
      redirect(`${back}?error=upload&message=${encodeURIComponent((error as Error).message)}`);
    }
  }

  const faq = [0, 1, 2, 3]
    .map((i) => ({ q: str(formData, `faqQ_${i}`).trim(), a: str(formData, `faqA_${i}`).trim() }))
    .filter((f) => f.q && f.a);

  const old = id
    ? await db.category.findUnique({ where: { id }, include: { parent: { select: { slug: true } } } })
    : null;

  const category = id
    ? await db.category.update({
        where: { id },
        data: {
          name: data.name,
          shortName: data.shortName,
          slug,
          parentId,
          h1: data.h1 || data.shortName,
          intro: data.intro,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          seoContent: data.seoContent,
          imageUrl,
          ogImageUrl: data.ogImageUrl || null,
          tone: data.tone,
          status: data.status,
          sortOrder: data.sortOrder,
          showOnHome: data.showOnHome,
          showInFooter: data.showInFooter,
          faq: faq.length ? faq : undefined,
        },
      })
    : await db.category.create({
        data: {
          name: data.name,
          shortName: data.shortName,
          slug,
          parentId,
          h1: data.h1 || data.shortName,
          intro: data.intro,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          seoContent: data.seoContent,
          imageUrl,
          ogImageUrl: data.ogImageUrl || null,
          tone: data.tone,
          status: data.status,
          sortOrder: data.sortOrder,
          showOnHome: data.showOnHome,
          showInFooter: data.showInFooter,
          faq: faq.length ? faq : undefined,
        },
      });

  if (old) {
    const oldUrl = fullPath(old);
    const newUrl = (await db.category.findUnique({ where: { id: category.id }, include: { parent: { select: { slug: true } } } }))!;
    const nextUrl = fullPath(newUrl);
    if (oldUrl !== nextUrl) {
      await db.categoryRedirect.upsert({
        where: { fromPath: oldUrl },
        update: { categoryId: category.id },
        create: { fromPath: oldUrl, categoryId: category.id },
      });
    }
  }

  invalidate("categories", `category:${category.id}`, "products");
  redirect(`/admin/categories/${category.id}?saved=1`);
}

export async function toggleCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const field = str(formData, "field");
  const category = await db.category.findUnique({ where: { id } });
  if (!category) redirect("/admin/categories");
  if (field === "status") {
    await db.category.update({ where: { id }, data: { status: category.status === "LIVE" ? "HIDDEN" : "LIVE" } });
  } else if (field === "showOnHome" || field === "showInFooter") {
    await db.category.update({ where: { id }, data: { [field]: !category[field] } });
  }
  invalidate("categories", `category:${id}`, "products");
  redirect("/admin/categories");
}

export async function moveCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const direction = str(formData, "direction");
  const category = await db.category.findUnique({ where: { id } });
  if (!category) redirect("/admin/categories");
  const neighbour = await db.category.findFirst({
    where: {
      parentId: category.parentId,
      sortOrder: direction === "up" ? { lt: category.sortOrder } : { gt: category.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (neighbour) {
    await db.$transaction([
      db.category.update({ where: { id: category.id }, data: { sortOrder: neighbour.sortOrder } }),
      db.category.update({ where: { id: neighbour.id }, data: { sortOrder: category.sortOrder } }),
    ]);
  }
  invalidate("categories", "products");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const moveTo = str(formData, "moveTo") || null;
  const [products, children] = await Promise.all([
    db.product.count({ where: { categoryId: id } }),
    db.category.count({ where: { parentId: id } }),
  ]);

  if (children > 0) {
    redirect(`/admin/categories/${id}?error=children&children=${children}`);
  }
  if (products > 0 && !moveTo) {
    redirect(`/admin/categories/${id}?error=inuse&products=${products}`);
  }
  if (moveTo) {
    const target = await db.category.findUnique({ where: { id: moveTo } });
    if (!target) redirect(`/admin/categories/${id}?error=move`);
    await db.product.updateMany({ where: { categoryId: id }, data: { categoryId: moveTo } });
  }

  await db.category.delete({ where: { id } });
  invalidate("categories", `category:${id}`, "products");
  redirect("/admin/categories");
}
