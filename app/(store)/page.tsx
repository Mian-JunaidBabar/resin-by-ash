import type { Metadata } from "next";
import Link from "next/link";
import { TrustRow } from "@/components/store/chrome";
import { Carousel } from "@/components/store/carousel";
import { ArchFrame, Eyebrow, ProductCard, ResinArt, SectionHead } from "@/components/ui";
import { TONES } from "@/lib/data/catalog";
import { getBestSellers, getCategories, getLatest } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} · Handmade resin nikkah trays, jewellery & flower preservation` },
  description:
    "Keepsakes, poured by hand. Nikkah trays and pens, resin jewellery, wedding flower preservation and custom pieces from Ash's studio in Pakistan. Free personalisation, Cash on Delivery nationwide.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { n: 1, title: "Share your idea", text: "Names, date, colours and a few photos, sent on WhatsApp." },
  { n: 2, title: "Design + quote", text: "Ash sketches it out and confirms the price." },
  { n: 3, title: "Progress photo", text: "See your piece before it is finished." },
  { n: 4, title: "Delivered", text: "Cash on Delivery anywhere in Pakistan." },
];

const SOCIAL = [
  { label: "Reel", href: SITE.instagram, tone: TONES.blush },
  { label: "TikTok", href: SITE.tiktok, tone: TONES.gold },
  { label: "Post", href: SITE.instagram, tone: TONES.ivory },
  { label: "TikTok", href: SITE.tiktok, tone: TONES.ocean },
  { label: "Reel", href: SITE.instagram, tone: TONES.rose },
  { label: "Post", href: SITE.instagram, tone: TONES.sage },
];

export default async function HomePage() {
  const [cats, latest, best] = await Promise.all([getCategories(), getLatest(8), getBestSellers(8)]);
  const tiles = [
    ...cats.filter((c) => c.showOnHome).map((c) => ({ name: c.name, href: `/shop/${c.slug}`, tone: c.tone, seed: c.slug })),
    { name: "Custom Orders", href: "/custom", tone: "#ECE5DE", seed: "custom" },
  ].slice(0, 6);

  return (
    <>
      {/* ───── Hero ───── */}
      <section className="wrap grid items-center gap-7 pt-7 pb-10 lg:grid-cols-2 lg:gap-20 lg:pt-16 lg:pb-[72px]">
        <div className="flex max-w-[520px] flex-col gap-3.5 lg:gap-[22px]">
          <Eyebrow line className="enter" >
            Handmade resin studio · Pakistan
          </Eyebrow>
          <h1
            className="enter font-display text-[46px] leading-[1.04] font-medium tracking-[-0.01em] lg:text-[84px] lg:leading-[0.98] lg:tracking-[-0.015em]"
            style={{ ["--d" as string]: "80ms" }}
          >
            Keepsakes, poured <em>by hand.</em>
          </h1>
          <p className="enter text-[15px] leading-relaxed lg:max-w-[440px] lg:text-lg lg:leading-[1.65]" style={{ ["--d" as string]: "160ms" }}>
            Nikkah trays, jewellery and preserved flowers, each piece made one at a time by Ash.
          </p>
          <div className="enter mt-1.5 flex gap-2.5 lg:mt-2.5 lg:gap-3.5" style={{ ["--d" as string]: "240ms" }}>
            <Link href="/shop" className="btn btn-primary flex-1 lg:flex-none">
              Shop now
            </Link>
            <Link href="/custom" className="btn btn-outline flex-1 lg:flex-none">
              Make it custom
            </Link>
          </div>
        </div>
        <div className="enter-fade flex justify-center" style={{ ["--d" as string]: "120ms" }}>
          {/* Hero photo slot (nikkah tray, 4:5). Replace ResinArt with <Image priority> when photos arrive. */}
          <ArchFrame className="h-[438px] w-full lg:h-[588px] lg:w-[470px]" inset={10} sheen>
            <div className="absolute inset-0">
              <ResinArt seed="hero-nikkah-tray" tone={["#F6F2ED", TONES.gold]} />
            </div>
            <span aria-hidden="true" className="float absolute top-[22%] left-[18%] h-2 w-2 rounded-full bg-gold/70" />
            <span
              aria-hidden="true"
              className="float absolute top-[34%] right-[20%] h-1.5 w-1.5 rounded-full bg-gold/60"
              style={{ animationDelay: "1.5s" }}
            />
            <span
              aria-hidden="true"
              className="float absolute bottom-[30%] left-[30%] h-1 w-1 rounded-full bg-gold/70"
              style={{ animationDelay: "3s" }}
            />
          </ArchFrame>
        </div>
      </section>

      {/* ───── Shop by category ───── */}
      <section className="wrap flex flex-col gap-6 pt-2 pb-11 lg:gap-10 lg:border-t lg:border-sand-2 lg:pt-10 lg:pb-14">
        <SectionHead center eyebrow="Shop by category" title="Find your keepsake" className="reveal" />
        <div className="reveal-stagger grid grid-cols-3 gap-x-3.5 gap-y-[22px] lg:grid-cols-6 lg:gap-6">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col items-center gap-2.5 text-center no-underline lg:gap-3.5"
            >
              <ArchFrame
                className="h-[134px] w-full transition-transform duration-500 group-hover:-translate-y-1 lg:h-[225px]"
                bg={t.tone}
                line="none"
              >
                <div className="zoom-img absolute inset-0 opacity-80">
                  <ResinArt seed={t.seed} tone={[t.tone, TONES.blush]} />
                </div>
              </ArchFrame>
              <span className="text-[13px] leading-tight font-medium transition-colors group-hover:text-caramel lg:text-[15px]">
                {t.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Latest arrivals ───── */}
      <div className="pb-11 lg:pt-10 lg:pb-16">
        <Carousel
          label="Latest arrivals"
          slideClass="w-[156px] lg:w-[270px]"
          head={
            <SectionHead
              eyebrow="Fresh from the studio"
              title="Latest arrivals"
              className="flex-1"
              action={
                <Link href="/shop?sort=newest" className="link-underline py-3 text-sm font-medium lg:text-[15px]">
                  View all
                </Link>
              }
            />
          }
        >
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} sizes="(min-width: 1024px) 270px, 156px" />
          ))}
        </Carousel>
      </div>

      {/* ───── Best sellers ───── */}
      <section className="wrap flex flex-col gap-[22px] pb-12 lg:gap-8 lg:pt-10 lg:pb-20">
        <SectionHead
          eyebrow="Most loved"
          title="Best sellers"
          className="reveal"
          action={
            <Link href="/shop?sort=best" className="link-underline py-3 text-sm font-medium lg:text-[15px]">
              <span className="lg:hidden">View all</span>
              <span className="hidden lg:inline">View all best sellers</span>
            </Link>
          }
        />
        <div className="reveal-stagger grid grid-cols-2 gap-x-3.5 gap-y-[26px] lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
          {best.map((p) => (
            <ProductCard key={p.id} product={p} badge="best" />
          ))}
        </div>
      </section>

      {/* ───── Custom orders, four steps ───── */}
      <section className="bg-sand">
        <div className="wrap flex flex-col gap-6 py-12 lg:gap-9 lg:py-20">
          <div className="reveal flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="flex flex-col gap-2.5">
              <span className="eyebrow">Custom orders</span>
              <h2 className="font-display text-[34px] leading-[1.08] font-medium lg:text-[52px] lg:leading-[1.02]">
                Your idea, made in <em>four easy steps.</em>
              </h2>
            </div>
            <Link href="/custom" className="btn btn-primary hidden shrink-0 lg:inline-flex">
              Make it custom
            </Link>
          </div>
          <ol className="reveal-stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex flex-col gap-2 rounded-[14px] bg-cream p-4 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] lg:gap-3 lg:rounded-2xl lg:p-[26px]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold font-display text-lg font-semibold lg:h-10 lg:w-10 lg:text-[21px]">
                  {s.n}
                </span>
                <strong className="text-[15px] font-semibold lg:font-display lg:text-[25px]">{s.title}</strong>
                <span className="text-[13px] leading-normal lg:text-[15px] lg:leading-[1.55]">{s.text}</span>
              </li>
            ))}
          </ol>
          <Link href="/custom" className="btn btn-primary lg:hidden">
            Make it custom
          </Link>
        </div>
      </section>

      {/* ───── Flower preservation ───── */}
      <section className="wrap grid items-center gap-5 py-12 lg:grid-cols-2 lg:gap-20 lg:py-[88px]">
        <ArchFrame className="reveal h-[300px] w-full lg:h-[500px]" bg="#ECE5DE" inset={14} line="lg">
          <div className="absolute inset-0">
            <ResinArt seed="bouquet-block" tone={["#ECE5DE", TONES.rose]} />
          </div>
        </ArchFrame>
        <div className="reveal flex max-w-[500px] flex-col gap-5 lg:gap-[22px]">
          <span className="eyebrow">Flower preservation</span>
          <h2 className="font-display text-[34px] leading-[1.08] font-medium lg:text-[52px] lg:leading-[1.02]">
            Your wedding flowers, <em>kept for good.</em>
          </h2>
          <p className="text-[15px] leading-relaxed lg:text-[17px] lg:leading-[1.65]">
            Bridal bouquets, nikkah garlands, a single rose from the day. Ash dries them gently and sets them in clear
            resin, as blocks, frames, clocks or jewellery.
          </p>
          <div className="flex gap-2.5 lg:mt-1.5 lg:gap-3.5">
            <Link href="/custom?item=flower-preservation" className="btn btn-primary flex-1 lg:flex-none">
              Preserve my flowers
            </Link>
            <Link href="/shop/flower-preservation" className="btn btn-outline flex-1 lg:flex-none">
              See examples
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Reviews (chat screenshots) ───── */}
      <div className="bg-sand py-12 lg:py-20">
        <Carousel
          label="Customer reviews"
          slideClass="w-[210px] lg:w-[250px]"
          head={<SectionHead eyebrow="Kind words" title="Straight from the chats" className="flex-1" />}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <figure key={n} className="m-0 flex flex-col gap-2.5 lg:gap-3">
              {/* TODO(client): replace with screenshots from the Instagram "reviews" highlight */}
              <div className="flex h-[370px] items-center justify-center rounded-[20px] border border-line bg-cream p-5 text-center lg:h-[440px] lg:rounded-[22px]">
                <span className="text-[11px] leading-relaxed tracking-[0.1em] uppercase">
                  WhatsApp chat
                  <br />
                  screenshot {n}
                </span>
              </div>
              <figcaption className="text-[13px] lg:text-sm">[Customer first name], [city]</figcaption>
            </figure>
          ))}
        </Carousel>
      </div>

      {/* ───── Social ───── */}
      <section className="wrap flex flex-col gap-5 py-12 lg:gap-8 lg:pt-20 lg:pb-16">
        <div className="reveal flex flex-col items-center gap-1 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="flex flex-col gap-1 lg:gap-1.5">
            <span className="eyebrow">@ the studio</span>
            <h2 className="font-display text-[32px] leading-[1.1] font-medium lg:text-5xl lg:leading-[1.05]">
              Watch pieces come to life
            </h2>
          </div>
          <div className="hidden gap-3 lg:flex">
            <a href={SITE.instagram} target="_blank" rel="noopener" className="btn btn-outline !h-12 !px-[22px] !text-[15px]">
              Instagram
            </a>
            <a href={SITE.tiktok} target="_blank" rel="noopener" className="btn btn-outline !h-12 !px-[22px] !text-[15px]">
              TikTok
            </a>
          </div>
        </div>
        <div className="reveal-stagger grid grid-cols-3 gap-1.5 lg:grid-cols-6 lg:gap-3">
          {SOCIAL.map((t, i) => (
            <a
              key={i}
              href={t.href}
              target="_blank"
              rel="noopener"
              aria-label={`${t.label} on ${t.label === "TikTok" ? "TikTok" : "Instagram"}`}
              className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-[10px] p-2 text-brown no-underline lg:rounded-xl lg:p-3"
            >
              <span className="zoom-img absolute inset-0">
                <ResinArt seed={`social-${i}`} tone={["#F1EBE4", t.tone]} />
              </span>
              <span className="relative text-[9px] tracking-[0.1em] uppercase lg:text-[10px]">{t.label}</span>
            </a>
          ))}
        </div>
        <div className="flex gap-2.5 lg:hidden">
          <a href={SITE.instagram} target="_blank" rel="noopener" className="btn btn-outline !h-[46px] flex-1 !text-sm">
            Instagram
          </a>
          <a href={SITE.tiktok} target="_blank" rel="noopener" className="btn btn-outline !h-[46px] flex-1 !text-sm">
            TikTok
          </a>
        </div>
      </section>

      <TrustRow />
    </>
  );
}
