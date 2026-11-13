import type { Metadata } from "next";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { ContactForm } from "@/components/store/contact-form";
import { Eyebrow } from "@/components/ui";
import { getSettings } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Ash",
  description: "Message Ash on WhatsApp for orders, custom ideas or anything else. Studio hours, Instagram and TikTok.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const handle = (value: string) => {
    const tail = value.replace(/\/+$/, "").split("/").pop() ?? "";
    return tail.startsWith("@") ? tail : `@${tail}`;
  };
  return (
    <div className="wrap grid gap-0 lg:grid-cols-2 lg:gap-20 lg:py-16">
      <div>
        <section className="flex flex-col gap-2.5 pt-8 pb-[22px] lg:pt-0 lg:pb-8">
          <Eyebrow line className="enter">
            Contact
          </Eyebrow>
          <h1 className="enter font-display text-[42px] leading-[1.04] font-medium lg:text-7xl lg:leading-none" style={{ ["--d" as string]: "80ms" }}>
            Say hello to <em>Ash.</em>
          </h1>
          <p className="enter text-[15px] leading-relaxed lg:max-w-md lg:text-lg" style={{ ["--d" as string]: "160ms" }}>
            WhatsApp is the quickest way to reach her, for orders, custom ideas or anything else.
          </p>
        </section>
        <section className="flex flex-col gap-3">
          <a
            href={waLink(undefined, settings.whatsappNumber)}
            target="_blank"
            rel="noopener"
            className="enter group flex flex-col gap-3.5 rounded-[18px] bg-caramel px-[22px] py-6 text-white no-underline transition-colors hover:bg-caramel-dark hover:text-white"
            style={{ ["--d" as string]: "200ms" }}
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/60">
              <WhatsAppIcon size={24} />
            </span>
            <span className="font-display text-[30px] leading-[1.1] font-semibold">Chat on WhatsApp</span>
            <span className="text-[15px]">{settings.whatsappDisplay}</span>
            <span className="flex h-11 items-center self-start rounded-xl bg-cream px-[18px] text-[15px] font-semibold text-brown transition-transform group-hover:translate-x-1">
              Start chat
            </span>
          </a>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={settings.instagram || SITE.instagram}
              target="_blank"
              rel="noopener"
              className="flex flex-col gap-2.5 rounded-2xl border border-sand-2 bg-white p-[18px] no-underline transition-colors hover:border-brown"
            >
              <InstagramIcon size={24} />
              <strong className="text-base font-semibold">Instagram</strong>
              <span className="text-[13px]">{handle(settings.instagram || SITE.instagram)}</span>
            </a>
            <a
              href={settings.tiktok || SITE.tiktok}
              target="_blank"
              rel="noopener"
              className="flex flex-col gap-2.5 rounded-2xl border border-sand-2 bg-white p-[18px] no-underline transition-colors hover:border-brown"
            >
              <TikTokIcon size={24} />
              <strong className="text-base font-semibold">TikTok</strong>
              <span className="text-[13px]">{handle(settings.tiktok || SITE.tiktok)}</span>
            </a>
          </div>
        </section>
        <section className="mt-6 flex flex-col gap-2.5 rounded-2xl bg-sand p-5">
          <h2 className="mb-1 font-display text-2xl font-semibold">Studio hours</h2>
          {(settings.studioHours.length ? settings.studioHours : SITE.studioHours).map((h) => (
            <div key={h.days} className="flex justify-between text-[15px]">
              <span>{h.days}</span>
              <span>{h.hours}</span>
            </div>
          ))}
          <span className="text-[13px] leading-normal">Messages after hours are answered the next working day.</span>
        </section>
      </div>
      <div className="pt-8 pb-[52px] lg:pt-[52px] lg:pb-0">
        <ContactForm />
      </div>
    </div>
  );
}
