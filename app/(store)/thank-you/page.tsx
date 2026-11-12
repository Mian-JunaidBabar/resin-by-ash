import type { Metadata } from "next";
import { ThankYouView } from "@/components/store/thank-you-view";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return <ThankYouView />;
}
