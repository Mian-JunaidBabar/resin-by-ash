import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Pill, abtnGhost } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toggleMessageHandled } from "../actions";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireAdmin();
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const unread = messages.filter((m) => !m.handled).length;

  return (
    <>
      <PageTitle
        title="Messages"
        back={{ href: "/admin/requests", label: "Custom requests" }}
        sub={`${messages.length} contact form messages · ${unread} still to answer`}
      />

      <div className="overflow-hidden rounded-[14px] border border-sand-2 bg-white">
        {messages.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-cocoa">No messages yet. They arrive from the Contact page.</p>
        ) : (
          <div className="flex flex-col divide-y divide-sand-2">
            {messages.map((message) => (
              <article key={message.id} className="flex flex-col gap-2 px-[18px] py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-sm font-semibold">{message.name}</strong>
                    <span className="text-[13px] text-cocoa">{message.contact}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-cocoa">
                      {message.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" })}
                    </span>
                    <Pill className={message.handled ? "bg-st-done-bg text-st-done-fg" : "bg-st-new-bg text-st-new-fg"}>
                      {message.handled ? "Answered" : "New"}
                    </Pill>
                  </div>
                </div>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.message}</p>
                <form action={toggleMessageHandled} className="w-fit">
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="handled" value={message.handled ? "false" : "true"} />
                  <button type="submit" className={`${abtnGhost} !h-8 !text-[13px]`}>
                    {message.handled ? "Mark as new" : "Mark answered"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>

      <Link href="/admin/requests" className={`${abtnGhost} w-fit`}>
        Back to custom requests
      </Link>
    </>
  );
}
