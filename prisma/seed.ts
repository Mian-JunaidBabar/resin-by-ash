import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
import { PrismaClient } from "../lib/generated/prisma/client";
import { BEST_SELLER_ORDER, CATEGORIES, PRODUCTS } from "../lib/data/catalog";
import { FAQ_GROUPS } from "../lib/data/faq";
import { DELIVERY_ZONES } from "../lib/delivery";
import { SITE } from "../lib/site";
import { slugify } from "../lib/slug";
import { CATEGORY_PHOTOS, PRODUCT_PHOTOS, SOCIAL_PHOTOS, STUDIO_PHOTOS } from "../lib/data/studio-images";

/**
 * Idempotent seed: safe to run repeatedly (`npm run db:reset` runs it twice in tests).
 * Categories and products come from lib/data/catalog.ts, the same data the phase-1
 * frontend shipped with.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEFAULT_ORDER_TEMPLATE = `Assalam o Alaikum Ash! New order from the website

Order: {order_id}
{items_with_personalisation}

Total: {total} (Cash on Delivery)

Name: {name}
City: {city}
Address: {address}`;

const HOME_STEPS = [
  { title: "Share your idea", text: "Names, date, colours and a few photos, sent on WhatsApp." },
  { title: "Design + quote", text: "Ash sketches it out and confirms the price." },
  { title: "Progress photo", text: "See your piece before it is finished." },
  { title: "Delivered", text: "Cash on Delivery anywhere in Pakistan." },
];

const REVIEW_CAPTIONS = [
  "Ayesha, Lahore",
  "Hira, Karachi",
  "Fatima, Islamabad",
  "Zainab, Multan",
  "Mariam, Faisalabad",
  "Noor, Rawalpindi",
];

const SOCIAL_TILES = [
  { label: "Reel", href: SITE.instagram },
  { label: "TikTok", href: SITE.tiktok },
  { label: "Post", href: SITE.instagram },
  { label: "TikTok", href: SITE.tiktok },
  { label: "Reel", href: SITE.instagram },
  { label: "Post", href: SITE.instagram },
];

const day = (iso: string, endOfDay = false) =>
  new Date(`${iso}T${endOfDay ? "23:59:59" : "12:00:00"}+05:00`);

async function upsertCategory(input: {
  slug: string;
  parentId: string | null;
  name: string;
  shortName: string;
  h1: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  seoContent: string;
  sortOrder: number;
  showOnHome: boolean;
  showInFooter: boolean;
  tone: string;
  imageUrl: string | null;
  ogImageUrl: string | null;
}) {
  const existing = await db.category.findFirst({ where: { parentId: input.parentId, slug: input.slug } });
  if (existing) {
    return db.category.update({ where: { id: existing.id }, data: input });
  }
  return db.category.create({ data: input });
}

async function seedCategories() {
  const topIds = new Map<string, string>();
  const childIds = new Map<string, string>(); // "parentSlug/childSlug"

  for (const c of CATEGORIES) {
    const top = await upsertCategory({
      slug: c.slug,
      parentId: null,
      name: c.name,
      shortName: c.shortName,
      h1: c.shortName,
      intro: c.intro,
      metaTitle: `${c.name} · Handmade resin in Pakistan`,
      metaDescription: c.seoDescription,
      seoContent: [
        `## Handmade ${c.name.toLowerCase()} in Pakistan`,
        "",
        `${c.intro} Every piece is poured by hand in Ash's studio, so no two are exactly alike.`,
        "",
        `Personalisation is free: names, dates and short text are set into the resin. Delivery is nationwide with Cash on Delivery, and custom colours are always welcome.`,
      ].join("\n"),
      sortOrder: c.sortOrder,
      showOnHome: c.showOnHome,
      showInFooter: true,
      tone: c.tone,
      imageUrl: CATEGORY_PHOTOS[c.slug] ?? null,
      ogImageUrl: CATEGORY_PHOTOS[c.slug] ?? null,
    });
    topIds.set(c.slug, top.id);

    for (const [childIndex, name] of c.subcategories.entries()) {
      const slug = slugify(name);
      const child = await upsertCategory({
        slug,
        parentId: top.id,
        name,
        shortName: name,
        h1: name,
        intro: `Handmade resin ${name.toLowerCase()} from Ash's studio, personalised and delivered across Pakistan.`,
        metaTitle: `${name} · Handmade resin in Pakistan`,
        metaDescription: `Shop handmade resin ${name.toLowerCase()} in Pakistan. Personalised pieces with Cash on Delivery nationwide.`,
        seoContent: [
          `## Resin ${name.toLowerCase()} made by hand`,
          "",
          `Browse the ${name.toLowerCase()} in this collection, or ask Ash for a custom colour or size. Names, dates and short text are always free to add.`,
        ].join("\n"),
        sortOrder: childIndex + 1,
        showOnHome: false,
        showInFooter: false,
        tone: c.tone,
        imageUrl: CATEGORY_PHOTOS[c.slug] ?? null,
        ogImageUrl: CATEGORY_PHOTOS[c.slug] ?? null,
      });
      childIds.set(`${c.slug}/${slug}`, child.id);
    }

    // Catalogue subcategory labels are names ("Wall clocks"); keep a name-keyed map too.
    for (const name of c.subcategories) {
      childIds.set(`${c.slug}/${name}`, childIds.get(`${c.slug}/${slugify(name)}`)!);
    }
  }

  return { topIds, childIds };
}

async function seedProducts(childIds: Map<string, string>) {
  for (const p of PRODUCTS) {
    const categoryId = childIds.get(`${p.category}/${p.subcategory ?? ""}`);
    if (!categoryId) throw new Error(`No category for ${p.slug} (${p.category}/${p.subcategory})`);

    const pinIndex = BEST_SELLER_ORDER.indexOf(p.slug);
    const pinned = pinIndex !== -1;

    const variants = [
      ...(p.sizes ?? []).map((v, i) => ({
        kind: "size",
        name: v.name,
        swatch: v.swatch ?? null,
        priceDelta: v.priceDelta ?? 0,
        position: i,
      })),
      ...(p.colours ?? []).map((v, i) => ({
        kind: "colour",
        name: v.name,
        swatch: v.swatch ?? null,
        priceDelta: v.priceDelta ?? 0,
        position: i,
      })),
    ];

    const photos = (PRODUCT_PHOTOS[p.slug] ?? []).map((url, position) => ({
      url,
      alt: p.name,
      width: 1000,
      height: 1250,
      position,
    }));

    const fields = {
      slug: p.slug,
      name: p.name,
      categoryId,
      description: p.description,
      details: p.details,
      care: p.care,
      price: p.price,
      salePrice: p.salePrice ?? null,
      saleEndsAt: p.saleEndsAt ? day(p.saleEndsAt, true) : null,
      toneBg: p.tone[0],
      toneAccent: p.tone[1],
      customisable: p.customisable,
      personalisation: p.personalisation,
      occasions: p.occasions,
      leadTime: p.leadTime,
      pinnedBestSeller: pinned,
      pinOrder: pinned ? pinIndex : null,
      showInLatest: p.showInLatest ?? false,
      status: p.status === "draft" ? ("DRAFT" as const) : p.status === "hidden" ? ("HIDDEN" as const) : ("LIVE" as const),
      createdAt: day(p.createdAt),
    };

    await db.product.upsert({
      where: { slug: p.slug },
      update: {
        ...fields,
        variants: { deleteMany: {}, create: variants },
        images: { deleteMany: {}, create: photos },
      },
      create: { ...fields, variants: { create: variants }, images: { create: photos } },
    });
  }
}

async function seedSettings() {
  const faq = FAQ_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items,
  }));

  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? SITE.whatsapp).replace(/\D/g, ""),
      whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? SITE.whatsappDisplay,
      instagram: SITE.instagram,
      tiktok: SITE.tiktok,
      studioHours: JSON.stringify(SITE.studioHours),
      announcementOn: true,
      announcement: SITE.announcement,
      orderPrefix: SITE.orderPrefix,
      defaultLeadTime: SITE.defaultLeadTime,
      orderMessageTemplate: DEFAULT_ORDER_TEMPLATE,
      acceptCod: true,
      searchSynonyms: { nikah: "nikkah", nikkah: "nikkah", jewelry: "jewellery", jewellery: "jewellery" },
      faq,
    },
  });

  for (const [position, zone] of DELIVERY_ZONES.entries()) {
    const existing = await db.deliveryZone.findFirst({ where: { label: zone.label } });
    const data = { label: zone.label, cities: [...zone.cities], charge: zone.charge, days: zone.days, position };
    if (existing) await db.deliveryZone.update({ where: { id: existing.id }, data });
    else await db.deliveryZone.create({ data });
  }

  const home = await db.homeContent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      heroEyebrow: "Handmade resin studio · Pakistan",
      heroHeadline: "Keepsakes, poured",
      heroHeadlineEm: "by hand.",
      heroSubcopy: "Nikkah trays, jewellery and preserved flowers, each piece made one at a time by Ash.",
      heroImageUrl: STUDIO_PHOTOS.hero,
      primaryCtaLabel: "Shop now",
      primaryCtaHref: "/shop",
      secondaryCtaLabel: "Make it custom",
      secondaryCtaHref: "/custom",
      flowerHeadline: "Your wedding flowers, kept for good.",
      flowerCopy:
        "Bridal bouquets, nikkah garlands, a single rose from the day. Ash dries them gently and sets them in clear resin, as blocks, frames, clocks or jewellery.",
      flowerImageUrl: STUDIO_PHOTOS.flower,
      steps: HOME_STEPS,
    },
  });

  await db.homeContent.update({
    where: { id: 1 },
    data: {
      heroImageUrl: home.heroImageUrl ?? STUDIO_PHOTOS.hero,
      flowerImageUrl: home.flowerImageUrl ?? STUDIO_PHOTOS.flower,
    },
  });

  for (const [sortOrder, caption] of REVIEW_CAPTIONS.entries()) {
    const existing = await db.review.findFirst({ where: { caption } });
    const data = { caption, sortOrder, published: true };
    if (existing) await db.review.update({ where: { id: existing.id }, data });
    else await db.review.create({ data });
  }

  for (const [sortOrder, tile] of SOCIAL_TILES.entries()) {
    const existing = await db.socialTile.findFirst({ where: { sortOrder } });
    const data = { ...tile, imageUrl: SOCIAL_PHOTOS[sortOrder] ?? null, sortOrder };
    if (existing) await db.socialTile.update({ where: { id: existing.id }, data });
    else await db.socialTile.create({ data });
  }
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "ash@resinbyash.pk").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "studio-pass-2026";
  const passwordHash = await bcrypt.hash(password, 12);

  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "OWNER" },
    create: { email, name: "Ash", role: "OWNER", passwordHash },
  });
}

async function resetOrderSequenceIfEmpty() {
  const orders = await db.order.count();
  if (orders === 0) {
    await db.$executeRawUnsafe("SELECT setval('order_number_seq', 1047, false)");
  }
}

async function main() {
  const { childIds } = await seedCategories();
  await seedProducts(childIds);
  await seedSettings();
  await seedAdmin();
  await resetOrderSequenceIfEmpty();

  const [categories, products, zones] = await Promise.all([
    db.category.count(),
    db.product.count(),
    db.deliveryZone.count(),
  ]);
  console.log(
    `Seed complete: ${categories} categories, ${products} products (${PRODUCTS.filter((p) => p.status !== "draft").length} live), ${zones} delivery zones.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
