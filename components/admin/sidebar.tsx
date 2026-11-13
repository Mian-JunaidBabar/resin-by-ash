"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Home page", href: "/admin/home" },
  { label: "Orders", href: "/admin/orders", badge: 5 },
  { label: "Custom requests", href: "/admin/requests", badge: 3 },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Settings", href: "/admin/settings" },
];

/** Admin nav from components.html "Admin sidebar": stacks on wide screens, wraps into a grid on phones. */
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-[18px] px-3.5 py-5 lg:sticky lg:top-0 lg:min-h-dvh">
      <div className="flex items-center gap-2.5 px-1.5">
        <Image src="/brand/logo-256.png" alt="" width={40} height={40} className="rounded-full" />
        <div className="flex flex-col">
          <strong className="font-display text-xl leading-[1.1] font-semibold">Resin by Ash</strong>
          <span className="text-xs text-cocoa">Studio admin</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {LINKS.map((l) => {
          const on = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={on ? "page" : undefined}
              className={`flex h-10 flex-[1_1_150px] items-center justify-between rounded-[10px] px-3 text-sm no-underline transition-colors hover:bg-cream/70 lg:flex-[1_1_100%] ${
                on ? "bg-cream font-bold" : "font-medium"
              }`}
            >
              <span>{l.label}</span>
              {l.badge ? (
                <span className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-caramel px-1.5 text-[11px] font-bold text-white">
                  {l.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      <div className="h-px bg-line" />
      <div className="flex items-center justify-between px-3">
        <Link href="/" className="text-[13px] font-medium underline underline-offset-[3px]">
          View store
        </Link>
        <Link href="/admin/login" className="text-[13px] font-medium text-cocoa no-underline hover:text-caramel">
          Sign out
        </Link>
      </div>
    </nav>
  );
}
