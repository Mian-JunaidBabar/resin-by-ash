import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Admin shell. The session is checked inside the Suspense boundary (it reads
 * cookies), and every admin page/action checks again on its own.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}

async function PanelShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [orders, requests] = await Promise.all([
    db.order.count({ where: { status: "NEW" } }),
    db.customRequest.count({ where: { status: "NEW" } }),
  ]);
  return (
    <div className="flex min-h-dvh flex-wrap items-stretch bg-cream text-brown">
      <aside className="max-w-full flex-[1_1_232px] bg-sand lg:max-w-[232px]">
        <AdminSidebar badges={{ orders, requests }} />
      </aside>
      <main id="main" className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-4 pt-7 pb-12 sm:px-[clamp(16px,3vw,40px)]">
        {children}
      </main>
    </div>
  );
}

function AdminShellFallback() {
  return (
    <div className="flex min-h-dvh flex-wrap items-stretch bg-cream text-brown" aria-busy="true">
      <aside className="max-w-full flex-[1_1_232px] bg-sand lg:max-w-[232px]" />
      <main id="main" className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-4 pt-7 pb-12 sm:px-[clamp(16px,3vw,40px)]" />
    </div>
  );
}
