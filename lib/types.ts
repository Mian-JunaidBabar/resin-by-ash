/**
 * Domain types shared by the storefront and admin.
 * Phase 2: these map 1:1 to database tables (see docs/phase-2/02-data-model.md).
 */

export type CategorySlug =
  | "nikkah"
  | "jewellery"
  | "flower-preservation"
  | "keychains"
  | "watches-clocks"
  | "gifts";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Shorter label for chips and nav */
  shortName: string;
  intro: string;
  /** SEO description for the category page */
  seoDescription: string;
  subcategories: string[];
  showOnHome: boolean;
  sortOrder: number;
  /** Placeholder tone until an arch tile photo is uploaded */
  tone: string;
  image?: string;
};

export type Occasion = "Nikkah" | "Wedding" | "Birthday" | "Eid" | "Anniversary" | "Gift";

export type VariantOption = {
  name: string;
  /** Added to the unit price, in PKR */
  priceDelta?: number;
  /** Hex colour for colour swatches */
  swatch?: string;
};

export type PersonalisationField = "names" | "date" | "text" | "textColour" | "referenceImage";

export type ProductStatus = "live" | "draft" | "hidden";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  subcategory?: string;
  /** One or two sentences, shown under the price */
  description: string;
  details: string;
  care: string;
  /** Regular price in PKR */
  price: number;
  /** Optional sale price in PKR. Only shown when lower than price. */
  salePrice?: number;
  /** ISO date the sale ends (inclusive) */
  saleEndsAt?: string;
  /** Real photo URLs (4:5). Empty means the placeholder artwork is shown. */
  images: string[];
  /** Placeholder palette: [background, resin accent] */
  tone: [string, string];
  customisable: boolean;
  personalisation: PersonalisationField[];
  sizes?: VariantOption[];
  colours?: VariantOption[];
  occasions: Occasion[];
  leadTime: string;
  pinnedBestSeller: boolean;
  showInLatest?: boolean;
  soldCount: number;
  createdAt: string;
  status: ProductStatus;
};

export type PriceInfo = {
  price: number;
  was?: number;
  off?: number;
  save?: number;
  onSale: boolean;
};

export type OrderStatus = "New" | "Confirmed" | "In progress" | "Shipped" | "Delivered" | "Cancelled";

export type Personalisation = {
  names?: string;
  date?: string;
  text?: string;
  textColour?: string;
  referenceImage?: string;
};

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  size?: string;
  colour?: string;
  personalisation: Personalisation;
  unitPrice: number;
  unitWas: number;
  qty: number;
  tone: [string, string];
  image?: string;
};

export type OrderLine = {
  name: string;
  options: string;
  personal?: string;
  qty: number;
  unitPrice: number;
  unitWas: number;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: { name: string; phone: string; city: string; address: string };
  lines: OrderLine[];
  notes?: string;
  privateNote?: string;
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
  payment: "COD";
  status: OrderStatus;
  timeline: { label: string; at: string; done: boolean }[];
};

export type CustomRequestStatus = "New" | "Quoted" | "Accepted" | "Declined";

export type CustomRequest = {
  id: number;
  name: string;
  phone: string;
  city: string;
  item: string;
  budget: string;
  date: string;
  colours: string;
  description: string;
  status: CustomRequestStatus;
  age: string;
  received: string;
};

export type Customer = {
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  last: string;
  tag?: string;
};
