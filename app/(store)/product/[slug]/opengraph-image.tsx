import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { productPrice } from "@/lib/pricing";
import { getProduct } from "@/lib/queries";

export const alt = "A handmade piece from Resin by Ash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Turn a stored product image into something ImageResponse can render at request/build time. */
async function coverSource(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  if (/^https:\/\//.test(url)) return url;
  try {
    const clean = url.split("?")[0];
    const file = clean.startsWith("/uploads/")
      ? path.join(process.cwd(), ".uploads", path.basename(clean))
      : path.join(process.cwd(), "public", clean.replace(/^\//, ""));
    const ext = path.extname(file).slice(1).toLowerCase();
    if (!MIME[ext]) return null;
    const data = await readFile(file);
    return `data:${MIME[ext]};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function ProductOpenGraph({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const price = product ? productPrice(product) : null;
  const cover = await coverSource(product?.images[0]);
  const tone = product?.tone?.[0] ?? "#F1EBE4";
  const accent = product?.tone?.[1] ?? "#E9B8BE";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#FBF8F3",
          color: "#3B2B24",
          padding: 64,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 18, height: "100%", backgroundColor: accent }} />
        <div style={{ display: "flex", flexDirection: "column", width: 610, paddingRight: 40, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#9B725A" }}>
            <div style={{ width: 36, height: 1, backgroundColor: "#B08A5E" }} />
            Resin by Ash
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: product && product.name.length > 34 ? 54 : 66,
              lineHeight: 1.03,
              fontWeight: 600,
              maxWidth: 570,
            }}
          >
            {product?.name ?? "Handmade resin keepsakes"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34 }}>
            {price ? (
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
                Rs {price.price.toLocaleString("en-US")}
              </div>
            ) : null}
            {price?.onSale ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", fontSize: 24, color: "#8C7A6E", textDecoration: "line-through" }}>
                  Rs {price.was?.toLocaleString("en-US")}
                </div>
                <div style={{ display: "flex", backgroundColor: "#9B3B2F", color: "#FFF8F0", borderRadius: 999, padding: "6px 16px", fontSize: 22, fontWeight: 700 }}>
                  {price.off}% off
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 24, color: "#6C5548", lineHeight: 1.4 }}>
            Poured by hand in Pakistan · Cash on Delivery
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tone,
            borderRadius: "220px 220px 22px 22px",
            overflow: "hidden",
            border: "1px solid #D9C7B4",
          }}
        >
          {cover ? (
            <img src={cover} alt="" width={480} height={500} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", fontSize: 28, color: "#8B6E5B", textAlign: "center", padding: 40 }}>
              Keepsakes, poured by hand.
            </div>
          )}
        </div>
        <div style={{ position: "absolute", right: 64, bottom: 34, display: "flex", fontSize: 20, letterSpacing: 2, color: "#9B725A" }}>
          RESINBYASH.PK
        </div>
      </div>
    ),
    size,
  );
}
