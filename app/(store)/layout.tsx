import { Footer, Header, WhatsAppFab } from "@/components/store/chrome";
import { Analytics } from "@/components/store/analytics";
import { JsonLd } from "@/components/ui";
import { getCategoryTree, getProducts, getSettings } from "@/lib/queries";
import { productPrice } from "@/lib/pricing";
import { SITE, absoluteUrl } from "@/lib/site";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [products, tree, settings] = await Promise.all([getProducts(), getCategoryTree(), getSettings()]);
  const catName = Object.fromEntries(tree.map((c) => [c.slug, c.name]));
  const searchItems = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    price: productPrice(p).price,
    category: catName[p.category],
    tone: p.tone,
    keywords: [p.name, p.subcategory, catName[p.category], p.description, ...p.occasions, ...(p.colours ?? []).map((c) => c.name)]
      .filter(Boolean)
      .join(" "),
  }));
  const shopLinks = tree
    .filter((c) => c.showInFooter)
    .map((c) => ({ label: c.shortName, href: `/shop/${c.slug}` }));

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Store",
            "@id": absoluteUrl("/#store"),
            name: SITE.name,
            description: SITE.description,
            url: SITE.url,
            logo: absoluteUrl("/brand/logo-512.png"),
            image: absoluteUrl("/opengraph-image.jpg"),
            telephone: settings.whatsappDisplay,
            priceRange: "Rs 650 – Rs 8,500",
            currenciesAccepted: "PKR",
            paymentAccepted: settings.acceptCod ? "Cash on Delivery" : "Bank transfer",
            areaServed: { "@type": "Country", name: "Pakistan" },
            address: { "@type": "PostalAddress", addressCountry: "PK" },
            sameAs: [settings.instagram || SITE.instagram, settings.tiktok || SITE.tiktok].filter(Boolean),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": absoluteUrl("/#website"),
            name: SITE.name,
            url: SITE.url,
            inLanguage: "en-PK",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/shop?q={search_term_string}") },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      <Header searchItems={searchItems} settings={settings} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer shopLinks={shopLinks} settings={settings} />
      <WhatsAppFab phone={settings.whatsappNumber} />
      <Analytics />
    </>
  );
}
