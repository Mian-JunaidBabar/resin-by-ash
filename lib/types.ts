/**
 * Domain types shared by the storefront and admin.
 * Phase 2: these map 1:1 to database tables (see docs/phase-2/02-data-model.md).
 */

/** Categories are dynamic (admin-created), so slugs are plain strings. */
export type CategorySlug = string;

export type CategoryFaq = { q: string; a: string };

export type Category = {
  slug: string;
  name: string;
  /** Shorter label for chips and nav */
  shortName: string;
  h1?: string;
  metaTitle?: string;
  intro: string;
  /** SEO description for the category page */
  seoDescription: string;
  /** Markdown block rendered below the product grid */
  seoContent?: string;
  faq?: CategoryFaq[];
  subcategories: string[];
  /** LIVE children, for the top-category chips and the "Type" links */
  children?: { slug: string; name: string; shortName: string }[];
  showOnHome: boolean;
  showInFooter: boolean;
  sortOrder: number;
  /** Placeholder tone until an arch tile photo is uploaded */
  tone: string;
  image?: string;
  ogImage?: string;
  parentSlug?: string;
  status?: "LIVE" | "HIDDEN";
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
  categoryId?: string;
  /** Top-level + child category chain, used for breadcrumbs and links */
  categoryPath?: { slug: string; name: string; shortName: string }[];
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

/** Storefront settings, editable in the admin. */
export type StoreSettings = {
  whatsappNumber: string;
  whatsappDisplay: string;
  instagram: string;
  tiktok: string;
  studioHours: { days: string; hours: string }[];
  announcementOn: boolean;
  announcement: string;
  orderPrefix: string;
  defaultLeadTime: string;
  orderMessageTemplate: string;
  acceptCod: boolean;
  searchSynonyms: Record<string, string>;
  faq: { id: string; title: string; items: { q: string; a: string }[] }[];
  heroImageUrl?: string;
  heroHeadline?: string;
};

export type DeliveryZone = {
  id: string;
  label: string;
  cities: string[];
  charge: number;
  days: string;
  position: number;
};
