import Link from "next/link";
import { ArchFrame } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-5 text-center text-brown">
      <ArchFrame className="h-[200px] w-40" bg="#F1EBE4" inset={8}>
        <span className="absolute inset-0 flex items-center justify-center font-display text-5xl">404</span>
      </ArchFrame>
      <h1 className="mt-2 font-display text-[40px] leading-[1.05] font-medium">
        This piece <em>isn&apos;t here.</em>
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed">It may have sold out or moved. Browse the studio or ask Ash to make it for you.</p>
      <div className="flex gap-2.5">
        <Link href="/shop" className="btn btn-primary">
          Shop now
        </Link>
        <Link href="/custom" className="btn btn-outline">
          Make it custom
        </Link>
      </div>
    </main>
  );
}
