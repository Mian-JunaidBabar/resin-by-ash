import type { CategoryFaq } from "@/lib/types";
import { PlusIcon } from "@/components/icons";

/**
 * SEO copy + FAQ rendered below the category grid. The copy is stored as simple
 * markdown in the admin, so this renderer only needs headings and paragraphs.
 */
export function SeoBlock({ content, faq }: { content?: string; faq?: CategoryFaq[] }) {
  if (!content && !faq?.length) return null;

  const blocks = (content ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <section className="wrap pb-10 lg:pb-16">
      <div className="flex max-w-[760px] flex-col gap-4 border-t border-sand-2 pt-8 lg:gap-5 lg:pt-12">
        {blocks.map((block, i) => {
          if (block.startsWith("## ")) {
            return (
              <h2 key={i} className="font-display text-[26px] leading-[1.15] font-medium lg:text-[34px]">
                {block.slice(3)}
              </h2>
            );
          }
          if (block.startsWith("# ")) {
            return (
              <h2 key={i} className="font-display text-[26px] leading-[1.15] font-medium lg:text-[34px]">
                {block.slice(2)}
              </h2>
            );
          }
          return (
            <p key={i} className="text-[15px] leading-[1.7] text-cocoa lg:text-base">
              {block}
            </p>
          );
        })}

        {faq?.length ? (
          <div className="mt-3 flex flex-col">
            <h2 className="mb-2 font-display text-[24px] leading-[1.15] font-medium lg:text-[30px]">Common questions</h2>
            {faq.map((f, i) => (
              <details key={i} className={`acc border-t border-sand-2 py-1 ${i === faq.length - 1 ? "border-b" : ""}`}>
                <summary className="flex min-h-12 items-center justify-between gap-4 py-2 text-[15px] font-semibold">
                  {f.q}
                  <PlusIcon size={18} className="acc-icon shrink-0" />
                </summary>
                <p className="mb-3.5 text-sm leading-[1.65]">{f.a}</p>
              </details>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
