import type { Product, PriceInfo, VariantOption } from "@/lib/types";

export const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-US")}`;

/**
 * Promo pricing rule from the site plan:
 * show the strike + pill only when salePrice is set AND lower than price.
 * The percentage is always calculated (rounded down), never typed in.
 * Phase 2: also hide the sale once saleEndsAt has passed (needs request-time date).
 */
export function priceInfo(regular: number, sale?: number): PriceInfo {
  if (sale != null && sale > 0 && sale < regular) {
    return {
      price: sale,
      was: regular,
      save: regular - sale,
      off: Math.floor(((regular - sale) / regular) * 100),
      onSale: true,
    };
  }
  return { price: regular, onSale: false };
}

export function productPrice(p: Product): PriceInfo {
  return priceInfo(p.price, p.salePrice);
}

/** Unit price for a chosen size/colour. Deltas add to both the regular and sale price. */
export function variantPrice(p: Product, size?: VariantOption, colour?: VariantOption): PriceInfo {
  const delta = (size?.priceDelta ?? 0) + (colour?.priceDelta ?? 0);
  return priceInfo(p.price + delta, p.salePrice != null ? p.salePrice + delta : undefined);
}
