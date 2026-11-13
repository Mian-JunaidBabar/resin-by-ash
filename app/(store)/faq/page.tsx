import type { Metadata } from "next";
import { PlusIcon, WhatsAppIcon } from "@/components/icons";
import { Eyebrow, JsonLd } from "@/components/ui";
import { FAQ_GROUPS } from "@/lib/data/faq";
import { getDeliveryZones, getSettings } from "@/lib/queries";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "FAQ · Ordering, delivery, custom orders and resin care",
  description:
    "How to order on WhatsApp, delivery charges and Cash on Delivery across Pakistan, custom order timelines, and how to care for resin pieces.",
  alternates: { canonical: "/faq" },
  openGraph: { url: "/faq" },
};

export default async function FaqPage() {
  const [zones, settings] = await Promise.all([getDeliveryZones(), getSettings()]);
  const deliveryAnswer = zones
    .map((z) => `${z.label} Rs ${z.charge.toLocaleString("en-US")} (${z.days} days)`)
    .join(", ")
    .replace(/,([^,]*)$/, ", and$1");
  const groups = FAQ_GROUPS.map((g) => ({
    ...g,
    items: g.items.map((item) => (item.q === "How much is delivery?" ? { ...item, a: `${deliveryAnswer}.` } : item)),
  }));
  const answered = groups.flatMap((g) => g.items).filter((i) => !i.a.startsWith("["));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: answered.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="wrap lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-20 lg:py-16">
        <section className="flex flex-col gap-2.5 pt-8 pb-3 lg:sticky lg:top-[112px] lg:self-start lg:pt-0">
          <Eyebrow line className="enter">
            Help
          </Eyebrow>
          <h1 className="enter font-display text-[42px] leading-[1.04] font-medium lg:text-6xl" style={{ ["--d" as string]: "80ms" }}>
            Questions, <em>answered.</em>
          </h1>
          <nav aria-label="FAQ topics" className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:mt-4 lg:flex-col lg:items-start lg:px-0">
            {groups.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="chip !h-[38px] !px-3.5 !text-[13px] lg:!h-auto lg:!border-0 lg:!bg-transparent lg:!p-0 lg:!text-[15px] lg:hover:!text-caramel">
                {g.title}
              </a>
            ))}
          </nav>
        </section>
        <div>
          {groups.map((g) => (
            <section key={g.id} id={g.id} className="flex scroll-mt-28 flex-col pt-7 pb-1 lg:pt-0 lg:pb-12">
              <h2 className="mb-2.5 font-display text-[28px] leading-[1.1] font-medium lg:text-4xl">{g.title}</h2>
              {g.items.map((q, i) => (
                <details key={q.q} className={`acc border-t border-sand-2 py-0.5 ${i === g.items.length - 1 ? "lg:border-b" : ""}`}>
                  <summary className="flex min-h-[52px] items-center justify-between gap-3 text-[15px] leading-[1.35] font-semibold lg:text-base">
                    {q.q}
                    <PlusIcon size={18} className="acc-icon shrink-0" />
                  </summary>
                  <p className="mb-3.5 text-sm leading-[1.65] lg:text-[15px]">{q.a}</p>
                </details>
              ))}
            </section>
          ))}
          <section className="mt-8 mb-[52px] flex flex-col gap-3 rounded-2xl bg-sand px-5 py-6 lg:mt-0 lg:mb-0 lg:flex-row lg:items-center lg:justify-between lg:px-9">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-[28px] leading-[1.1] font-medium">Still wondering?</h2>
              <p className="text-sm leading-relaxed">Ask Ash directly. She usually replies within [reply time].</p>
            </div>
            <a href={waLink(undefined, settings.whatsappNumber)} target="_blank" rel="noopener" className="btn btn-primary shrink-0">
              <WhatsAppIcon size={20} /> Ask on WhatsApp
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
