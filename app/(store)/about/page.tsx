import type { Metadata } from "next";
import Link from "next/link";
import { ArchFrame, Eyebrow, ResinArt } from "@/components/ui";
import { TONES } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "About Ash and the studio",
  description:
    "One artist, every piece by hand. Meet Ash, the resin artist behind Resin by Ash, and see how each keepsake is poured, cured and polished in her studio in Pakistan.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", type: "profile" },
};

const PROCESS = [
  { n: 1, title: "Pour", text: "Resin is mixed in small batches and poured with petals, pigment or gold leaf.", tone: TONES.gold },
  { n: 2, title: "Cure", text: "Each piece sets slowly so it stays crystal clear.", tone: TONES.ocean },
  { n: 3, title: "Polish", text: "Edges are sanded, polished and checked by hand before packing.", tone: TONES.blush },
];

export default function AboutPage() {
  return (
    <>
      <section className="wrap grid items-center gap-[22px] pt-8 pb-10 lg:grid-cols-2 lg:gap-20 lg:py-16">
        <div className="flex flex-col gap-2.5 lg:order-2 lg:gap-5">
          <Eyebrow line className="enter">
            About the studio
          </Eyebrow>
          <h1 className="enter font-display text-[44px] leading-[1.04] font-medium lg:text-7xl lg:leading-none" style={{ ["--d" as string]: "80ms" }}>
            One artist, <em>every piece by hand.</em>
          </h1>
          <div className="hidden flex-col gap-5 pt-4 lg:flex">
            <Story />
          </div>
        </div>
        <ArchFrame className="enter-fade h-[420px] w-full lg:order-1 lg:h-[600px]" bg="#F1EBE4" inset={10} sheen>
          {/* TODO(client): photo of Ash in her studio */}
          <div className="absolute inset-0">
            <ResinArt seed="ash-studio" tone={["#F1EBE4", TONES.gold]} />
          </div>
          <span className="absolute inset-x-0 bottom-5 z-[3] text-center text-[10px] tracking-[0.12em] uppercase">
            Photo · Ash in her studio
          </span>
        </ArchFrame>
        <div className="flex flex-col gap-[22px] lg:hidden">
          <Story />
        </div>
      </section>

      <section className="bg-sand">
        <div className="wrap flex flex-col gap-5 py-11 lg:gap-10 lg:py-20">
          <div className="reveal flex flex-col gap-1">
            <span className="eyebrow">The process</span>
            <h2 className="font-display text-[32px] leading-[1.1] font-medium lg:text-5xl">From pour to polish</h2>
          </div>
          <div className="reveal-stagger grid gap-5 lg:grid-cols-3 lg:gap-8">
            {PROCESS.map((p) => (
              <article key={p.n} className="flex items-center gap-3.5 lg:flex-col lg:items-start lg:gap-5">
                <ArchFrame className="h-[150px] w-[120px] shrink-0 lg:h-[300px] lg:w-full" bg="#FBF9F6" line="none">
                  <div className="absolute inset-0">
                    <ResinArt seed={`process-${p.n}`} tone={["#FBF9F6", p.tone]} />
                  </div>
                </ArchFrame>
                <div className="flex flex-col gap-1.5">
                  <span className="font-display text-[15px] font-semibold text-cocoa">0{p.n}</span>
                  <strong className="font-display text-2xl leading-[1.1] font-semibold lg:text-3xl">{p.title}</strong>
                  <span className="text-sm leading-[1.55] lg:text-[15px]">{p.text}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap flex flex-col items-center gap-3.5 py-11 pb-[52px] text-center lg:py-20">
        <h2 className="reveal font-display text-[32px] leading-[1.1] font-medium lg:text-5xl">
          Let&apos;s make something <em>for you.</em>
        </h2>
        <p className="text-[15px] leading-relaxed lg:text-lg">Browse the studio or share your own idea.</p>
        <div className="mt-1.5 flex w-full gap-2.5 sm:w-auto lg:gap-3.5">
          <Link href="/shop" className="btn btn-primary flex-1">
            Shop now
          </Link>
          <Link href="/custom" className="btn btn-outline flex-1">
            Make it custom
          </Link>
        </div>
      </section>
    </>
  );
}

function Story() {
  return (
    <>
      <h2 className="font-display text-[32px] leading-[1.1] font-medium">Hi, I&apos;m Ash.</h2>
      <p className="text-[15px] leading-[1.7] lg:text-base">
        [How the studio started: the first piece Ash made, who it was for, and when she decided to make it her work.]
      </p>
      <p className="text-[15px] leading-[1.7] lg:text-base">
        [What she loves making most and why: nikkah sets, flowers from someone&apos;s big day, the moment a customer sees their piece.]
      </p>
      <span aria-hidden="true" className="mt-1.5 h-px w-10 bg-gold" />
      <p className="font-display text-2xl leading-[1.4] italic">“[One line from Ash in her own words.]”</p>
    </>
  );
}
