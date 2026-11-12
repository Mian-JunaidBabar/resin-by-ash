import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Studio admin", template: "%s · Studio admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return children;
}
