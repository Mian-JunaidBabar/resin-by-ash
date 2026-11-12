import { AdminSidebar } from "@/components/admin/sidebar";

/**
 * Admin shell. PHASE 2: guard every route here (and in each server action) with the
 * session check from docs/phase-2/04-auth-and-admin.md; unauthenticated → redirect("/admin/login").
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-wrap items-stretch bg-cream text-brown">
      <aside className="max-w-full flex-[1_1_232px] bg-sand lg:max-w-[232px]">
        <AdminSidebar />
      </aside>
      <main id="main" className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-4 pt-7 pb-12 sm:px-[clamp(16px,3vw,40px)]">
        {children}
      </main>
    </div>
  );
}
