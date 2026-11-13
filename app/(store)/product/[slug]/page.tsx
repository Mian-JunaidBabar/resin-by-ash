import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlusIcon } from "@/components/icons";
import { Gallery } from "@/components/store/gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ShopPageSkeleton } from "@/components/store/shop-skeleton";
import { Breadcrumbs, JsonLd, ProductCard } from "@/components/ui";
import { productPrice } from "@/lib/pricing";
import { getProduct, getProductStaticParams, getRelated, getSettings } from "@/lib/queries";
import { SITE, absoluteUrl } from "@/lib/site";

export async function generateStaticParams() {
  return getProductStaticParams();
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const price = productPrice(p);
  const title = `${p.name}${price.onSale ? ` · ${price.off}% off` : ""}`;
  const description = `${p.description} Rs ${price.price.toLocaleString("en-US")}${
    p.customisable ? ", free personalisation" : ""
  }. Handmade by Ash, Cash on Delivery across Pakistan.`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    robots: p.status === "hidden" ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: `/product/${p.slug}`,
      title: `${p.name} · ${SITE.name}`,
      description,
      images: p.images[0] ? [{ url: p.images[0], width: 1200, height: 1500, alt: p.name }] : undefined,
    },
    other: {
      "product:price:amount": String(price.price),
      "product:price:currency": "PKR",
    },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [related, settings] = await Promise.all([getRelated(product), getSettings()]);
  const price = productPrice(product);
  const path = product.categoryPath ?? [{ slug: product.category, name: product.category, shortName: product.category }];
  const category = path[0];
  const categoryHref = category ? (path[1] ? `/shop/${category.slug}/${path[1].slug}` : `/shop/${category.slug}`) : "/shop";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...path.map((c, i) => ({
      label: c.shortName,
      href: i === path.length - 1 ? categoryHref : `/shop/${c.slug}`,
    })),
    { label: product.name },
  ];
  const url = absoluteUrl(`/product/${product.slug}`);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "@id": `${url}#product`,
            name: product.name,
            description: `${product.description} ${product.details}`,
            sku: product.id,
            category: category?.name,
            brand: { "@type": "Brand", name: SITE.name },
            image: product.images.length ? product.images.map((i) => absoluteUrl(i)) : [absoluteUrl("/opengraph-image.jpg")],
            url,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "PKR",
              price: price.price,
              ...(price.onSale && product.saleEndsAt ? { priceValidUntil: product.saleEndsAt } : {}),
              availability: "https://schema.org/PreOrder",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@id": absoluteUrl("/#store") },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
              },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.label,
              item: c.href ? absoluteUrl(c.href) : url,
            })),
          },
        ]}
      />

      <div className="wrap-lg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-start lg:gap-16 lg:pt-10 xl:gap-20">
        <Gallery slug={product.slug} name={product.name} images={product.images} tone={product.tone} />

        <div className="flex flex-col">
          <section className="flex flex-col gap-3 px-5 pt-[22px] md:px-10 lg:px-0 lg:pt-0">
            <Breadcrumbs items={crumbs} />
            <h1 className="enter font-display text-4xl leading-[1.05] font-medium lg:text-5xl">{product.name}</h1>
            <p className="text-[15px] leading-relaxed lg:text-base">{product.description}</p>
          </section>

          <section className="px-5 pt-[22px] md:px-10 lg:px-0">
            <ProductPurchase product={product} whatsappNumber={settings.whatsappNumber} />
          </section>

          <section className="px-5 pt-[26px] md:px-10 lg:px-0">
            {[
              { title: "Details", body: product.details, open: true },
              { title: "Care", body: product.care },
              {
                title: "Delivery & payment",
                body: "Cash on Delivery all over Pakistan. Delivery in 1–6 days after your piece is ready, depending on your city. Charges from Rs 250, shown at checkout.",
              },
            ].map((a, i, arr) => (
              <details
                key={a.title}
                open={a.open}
                className={`acc border-t border-sand-2 py-1 ${i === arr.length - 1 ? "border-b" : ""}`}
              >
                <summary className="flex h-12 items-center justify-between text-[15px] font-semibold">
                  {a.title}
                  <PlusIcon size={18} className="acc-icon" />
                </summary>
                <p className="mb-3.5 text-sm leading-[1.65]">{a.body}</p>
              </details>
            ))}
          </section>
        </div>
      </div>

      {related.length ? (
        <section className="wrap flex flex-col gap-[18px] pt-10 pb-12 lg:gap-8 lg:pt-20 lg:pb-20">
          <h2 className="reveal font-display text-[28px] leading-[1.1] font-medium lg:text-5xl">You may also love</h2>
          <div className="reveal-stagger grid grid-cols-2 gap-x-3.5 gap-y-6 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
