import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons";
import { SendQuoteForm } from "@/components/admin/send-quote-form";
import { PageTitle, Pill, abtnGhost, abtnPrimary } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_LABEL } from "@/lib/orders";
import { getSettings } from "@/lib/queries";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_STYLES } from "@/lib/requests";
import { waLink } from "@/lib/whatsapp";
import { acceptRequest, convertToOrder, declineRequest } from "../actions";

export const metadata = { title: "Custom request" };

const dateText = (date: Date | null) =>
  date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [request, settings] = await Promise.all([
    db.customRequest.findUnique({ where: { id }, include: { order: { select: { id: true, number: true } } } }),
    getSettings(),
  ]);
  if (!request) notFound();

  const chatPhone = `92${request.phone.replace(/^0/, "").replace(/\D/g, "")}`;
  const orderLabel = request.order ? ORDER_LABEL(settings.orderPrefix, request.order.number) : null;

  return (
    <>
      <PageTitle
        title={request.name}
        back={{ href: "/admin/requests", label: "Custom requests" }}
        eyebrow={`Request #${request.id} · received ${dateText(request.createdAt)}`}
        sub={`${request.phone}${request.city ? ` · ${request.city}` : ""}`}
        actions={
          <>
            <Pill className={REQUEST_STATUS_STYLES[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Pill>
            <a href={waLink(undefined, chatPhone)} target="_blank" rel="noopener" className={abtnPrimary}>
              <WhatsAppIcon size={18} /> Reply on WhatsApp
            </a>
          </>
        }
      />

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col gap-5 rounded-[14px] border border-sand-2 bg-white p-5 lg:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Item", request.item],
              ["Occasion date", dateText(request.occasionDate)],
              ["Budget", request.budget],
              ["Colours", request.colours.length ? request.colours.join(", ") : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="text-xs font-semibold text-cocoa">{k}</dt>
                <dd className="text-[15px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-cocoa">Their idea</span>
            <p className="text-[15px] leading-relaxed whitespace-pre-line">{request.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-cocoa">Reference images</span>
            {request.imageUrls.length ? (
              <div className="flex flex-wrap gap-2.5">
                {request.imageUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener" className="block overflow-hidden rounded-[10px] border border-sand-2">
                    <Image src={url} alt={`Reference for request #${request.id}`} width={120} height={150} unoptimized className="h-[120px] w-[96px] object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-cocoa">No photos attached. Ask for references on WhatsApp.</p>
            )}
          </div>

          <SendQuoteForm
            requestId={request.id}
            quote={request.quote}
            readyBy={request.readyBy ? request.readyBy.toISOString().slice(0, 10) : null}
          />
        </section>

        <aside className="flex flex-col gap-[18px]">
          <section className="flex flex-col gap-3 rounded-[14px] border border-sand-2 bg-white p-[18px]">
            <h2 className="text-base font-bold">Next step</h2>
            <p className="text-[13px] leading-relaxed text-cocoa">
              Send the quote first. Once the customer agrees on WhatsApp, convert the request into an order.
            </p>
            <div className="flex flex-wrap gap-2">
              {request.status !== "ACCEPTED" ? (
                <form action={acceptRequest}>
                  <input type="hidden" name="id" value={request.id} />
                  <button type="submit" className={abtnGhost}>
                    Mark accepted
                  </button>
                </form>
              ) : null}
              {request.status !== "DECLINED" ? (
                <form action={declineRequest}>
                  <input type="hidden" name="id" value={request.id} />
                  <button type="submit" className={abtnGhost}>
                    Decline
                  </button>
                </form>
              ) : null}
            </div>
            {orderLabel ? (
              <Link href={`/admin/orders/${orderLabel}`} className={abtnPrimary}>
                Open order {orderLabel}
              </Link>
            ) : (
              <form action={convertToOrder}>
                <input type="hidden" name="id" value={request.id} />
                <button type="submit" disabled={!request.quote} className={`${abtnPrimary} w-full disabled:cursor-not-allowed disabled:opacity-50`}>
                  Convert to order
                </button>
              </form>
            )}
            {!request.quote && !orderLabel ? <span className="text-xs text-cocoa">Send a quote before converting.</span> : null}
          </section>

          <section className="flex flex-col gap-2 rounded-[14px] border border-sand-2 bg-white p-[18px] text-sm">
            <h2 className="text-base font-bold">Quote</h2>
            <div className="flex justify-between gap-2">
              <span className="text-cocoa">Amount</span>
              <strong>{request.quote ? `Rs ${request.quote.toLocaleString("en-US")}` : "Not sent"}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-cocoa">Ready by</span>
              <strong>{dateText(request.readyBy)}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-cocoa">Order</span>
              <strong>{orderLabel ?? "Not created"}</strong>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
