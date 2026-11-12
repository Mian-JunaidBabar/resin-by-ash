import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { CustomForm } from "@/components/store/custom-form";
import { ArchFrame, Eyebrow, JsonLd, ResinArt } from "@/components/ui";
import { TONES } from "@/lib/data/catalog";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Custom resin orders",
  description:
    "Have something in mind? Share your idea and Ash designs it with you: custom nikkah trays, name jewellery, preserved wedding flowers, clocks and gift sets. Free personalisation, Cash on Delivery.",
  alternates: { canonical: "/custom" },
  openGraph: { url: "/custom" },
};

const TILES = [
  { name: "Nikkah trays & pens", tone: TONES.gold },
  { name: "Jewellery", tone: TONES.blush },
  { name: "Flower preservation", tone: TONES.rose },
  { name: "Keychains", tone: TONES.ivory },
  { name: "Watches & clocks", tone: TONES.ocean },
  { name: "Gift sets", tone: TONES.sage },
];
const STEPS = [
  { n: 1, title: "Your idea", text: "Fill this in and it opens in WhatsApp with your photos." },
  { n: 2, title: "Design + quote", text: "Ash suggests layout and colours and confirms the price." },
  { n: 3, title: "Progress photo", text: "You see your piece before it is finished." },
  { n: 4, title: "Delivered", text: "Cash on Delivery anywhere in Pakistan." },
];
const PAST = ["Nikkah set", "Bouquet block", "Name clock", "Couple pens", "Pet keychain", "Quran stand"];
const FAQ = [
  { q: "How long does a custom piece take?", a: `Usually ${SITE.defaultLeadTime} after the design is agreed. Tell Ash your date early for nikkah orders.` },
  { q: "Is personalisation extra?", a: "No. Names, dates and short text are free." },
  { q: "Do I pay upfront?", a: "You pay Cash on Delivery. [Advance policy for large custom orders, if any.]" },
  { q: "Can I send my own flowers?", a: "Yes. Ash will share how to dry or courier them before you send." },
];

export default function CustomPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <section className="bg-sand">
        <div className="wrap grid items-center gap-3 pt-8 pb-[30px] lg:grid-cols-[1fr_380px] lg:gap-20 lg:py-20">
          <div className="flex flex-col gap-3 lg:gap-5">
            <Eyebrow line className="enter">
              Custom orders
            </Eyebrow>
            <h1 className="enter font-display text-[42px] leading-[1.04] font-medium lg:text-7xl lg:leading-[1]" style={{ ["--d" as string]: "80ms" }}>
              Have something in mind? <em>Let&apos;s make it.</em>
            </h1>
            <p className="enter text-[15px] leading-relaxed lg:max-w-lg lg:text-lg" style={{ ["--d" as string]: "160ms" }}>
              Names, dates, your colours, a flower from the day. Share the idea and Ash designs it with you.
            </p>
            <a href="#custom-form" className="enter btn btn-primary mt-1.5 lg:w-fit" style={{ ["--d" as string]: "240ms" }}>
              Start my request
            </a>
          </div>
          <ArchFrame className="enter-fade hidden h-[460px] lg:block" bg="#FBF9F6" inset={12} sheen>
            <div className="absolute inset-0">
              <ResinArt seed="custom-hero" tone={["#FBF9F6", TONES.blush]} />
            </div>
          </ArchFrame>
        </div>
      </section>

      <div className="wrap grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20 lg:pt-16">
        <div>
          <section className="flex flex-col gap-5 pt-10 pb-2 lg:pt-0">
            <h2 className="reveal font-display text-[30px] leading-[1.1] font-medium lg:text-[40px]">What Ash can make</h2>
            <div className="reveal-stagger grid grid-cols-3 gap-x-3 gap-y-[18px]">
              {TILES.map((t) => (
                <div key={t.name} className="flex flex-col items-center gap-2">
                  <ArchFrame className="h-[124px] w-full lg:h-[160px]" bg="#F1EBE4" line="none">
                    <div className="absolute inset-0 opacity-90">
                      <ResinArt seed={t.name} tone={["#F1EBE4", t.tone]} />
                    </div>
                  </ArchFrame>
                  <span className="text-center text-[13px] leading-tight font-medium lg:text-sm">{t.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 pt-9 pb-2">
            <h2 className="reveal font-display text-[30px] leading-[1.1] font-medium lg:text-[40px]">How it works</h2>
            <ol className="reveal-stagger flex flex-col">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-3.5 border-b border-sand-2 py-3">
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-gold font-display text-lg font-semibold">
                    {s.n}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-[15px] font-semibold">{s.title}</strong>
                    <span className="text-sm leading-normal">{s.text}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="hidden flex-col gap-4 pt-11 lg:flex">
            <PastWork />
          </section>
        </div>

        <div className="pt-8 lg:sticky lg:top-[112px] lg:self-start lg:pt-0">
          <CustomForm />
        </div>
      </div>

      <section className="wrap flex flex-col gap-4 pt-11 pb-2 lg:hidden">
        <PastWork />
      </section>

      <section className="wrap flex flex-col gap-2.5 pt-10 pb-[52px] lg:max-w-[900px] lg:pt-16 lg:pb-20">
        <h2 className="mb-1.5 font-display text-[30px] leading-[1.1] font-medium lg:text-[40px]">Quick questions</h2>
        {FAQ.map((f, i) => (
          <details key={f.q} className={`acc border-t border-sand-2 py-0.5 ${i === FAQ.length - 1 ? "border-b" : ""}`}>
            <summary className="flex min-h-[52px] items-center justify-between gap-3 text-[15px] font-semibold">
              {f.q}
              <PlusIcon size={18} className="acc-icon shrink-0" />
            </summary>
            <p className="mb-3.5 text-sm leading-[1.65]">{f.a}</p>
          </details>
        ))}
        <p className="pt-2 text-sm">
          More answers on the <Link href="/faq" className="link-underline font-semibold">FAQ page</Link>.
        </p>
      </section>
    </>
  );
}

function PastWork() {
  return (
    <>
      <div className="flex items-end justify-between">
        <h2 className="font-display text-[30px] leading-[1.1] font-medium lg:text-[40px]">Past custom work</h2>
        <a href={SITE.instagram} target="_blank" rel="noopener" className="link-underline py-3 text-sm font-medium">
          More on Instagram
        </a>
      </div>
      <div className="reveal-stagger grid grid-cols-3 gap-1.5 lg:gap-2.5">
        {PAST.map((p, i) => (
          <div key={p} className="relative flex aspect-[4/5] items-end overflow-hidden rounded-[10px] p-2">
            <ResinArt seed={`past-${p}`} tone={["#F1EBE4", Object.values(TONES)[i]]} />
            <span className="relative text-[9px] tracking-[0.1em] uppercase">{p}</span>
          </div>
        ))}
      </div>
    </>
  );
}
