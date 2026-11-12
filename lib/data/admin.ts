import type { CustomRequest, Customer, Order, OrderStatus } from "@/lib/types";

/**
 * Mock admin data copied from the admin designs.
 * Phase 2: replace with database queries in lib/admin/queries.ts (server only, behind auth).
 */

export const STATUS_STYLES: Record<OrderStatus, string> = {
  New: "bg-st-new-bg text-st-new-fg",
  Confirmed: "bg-st-confirmed-bg text-st-confirmed-fg",
  "In progress": "bg-st-progress-bg text-st-progress-fg",
  Shipped: "bg-st-shipped-bg text-st-shipped-fg",
  Delivered: "bg-st-done-bg text-st-done-fg",
  Cancelled: "bg-st-off-bg text-st-off-fg",
};

export const ORDER_STATUSES: OrderStatus[] = ["New", "Confirmed", "In progress", "Shipped", "Delivered", "Cancelled"];

type Row = {
  id: string;
  date: string;
  name: string;
  phone: string;
  city: string;
  items: string;
  total: number;
  status: OrderStatus;
};

export const ORDER_ROWS: Row[] = [
  { id: "RBA-1046", date: "12 Nov", name: "Sana K.", phone: "0300 •••• 214", city: "Lahore", items: "Name Keychain ×2, Lavender Studs", total: 2450, status: "New" },
  { id: "RBA-1045", date: "12 Nov", name: "Amna T.", phone: "0321 •••• 880", city: "Karachi", items: "Nikkah Tray & Pen Set", total: 7050, status: "Confirmed" },
  { id: "RBA-1044", date: "11 Nov", name: "Iqra M.", phone: "0333 •••• 452", city: "Islamabad", items: "Initial Keychain ×4", total: 2850, status: "In progress" },
  { id: "RBA-1043", date: "10 Nov", name: "Rabia S.", phone: "0345 •••• 019", city: "Multan", items: "Petal Wall Clock", total: 4750, status: "Shipped" },
  { id: "RBA-1042", date: "10 Nov", name: "Ayesha H.", phone: "0301 •••• 776", city: "Lahore", items: "Nikkah Tray & Pen Set, Pressed Rose Earrings", total: 8250, status: "In progress" },
  { id: "RBA-1041", date: "9 Nov", name: "Noor F.", phone: "0312 •••• 330", city: "Faisalabad", items: "Gold Flake Hoops", total: 1350, status: "Delivered" },
  { id: "RBA-1040", date: "9 Nov", name: "Hamna Q.", phone: "0302 •••• 641", city: "Rawalpindi", items: "Bridal Bouquet Block", total: 8750, status: "In progress" },
  { id: "RBA-1039", date: "8 Nov", name: "Hira R.", phone: "0322 •••• 905", city: "Lahore", items: "Pearl Drop Pendant", total: 1650, status: "Shipped" },
  { id: "RBA-1038", date: "7 Nov", name: "Mehwish D.", phone: "0331 •••• 118", city: "Peshawar", items: "Ocean Wrist Watch", total: 4150, status: "Cancelled" },
  { id: "RBA-1037", date: "6 Nov", name: "Rabia S.", phone: "0345 •••• 019", city: "Multan", items: "Mini Bouquet Block", total: 3450, status: "Delivered" },
];

export const SAMPLE_ORDER: Order = {
  id: "RBA-1042",
  createdAt: "10 Nov 2026, 9:14 pm",
  customer: { name: "Ayesha H.", phone: "0301 •••• 776", city: "Lahore", address: "[House, street, area]" },
  lines: [
    { name: "Gold-leaf Nikkah Tray & Pen Set", options: "Ivory marble · Gold leaf", personal: "Names: Ayesha & Hamza · Date: 14 Feb 2027 · Text colour: Gold", qty: 1, unitPrice: 6800, unitWas: 6800 },
    { name: "Pressed Rose Earrings", options: "Classic · Blush rose", personal: "Initials: A & H · Text colour: Gold", qty: 1, unitPrice: 1200, unitWas: 1500 },
  ],
  notes: "Please gift wrap the tray. Nikkah is on 14 Feb, delivery before the 10th please.",
  privateNote: "Gold leaf on rim only. Use the cream marble base.",
  subtotal: 8300,
  savings: 300,
  delivery: 250,
  total: 8250,
  payment: "COD",
  status: "In progress",
  timeline: [
    { label: "Order placed on site", at: "10 Nov, 9:14 pm", done: true },
    { label: "Confirmed on WhatsApp", at: "10 Nov, 10:02 pm", done: true },
    { label: "Design approved", at: "11 Nov, 1:30 pm", done: true },
    { label: "In progress", at: "Today", done: true },
    { label: "Ship by", at: "16 Nov", done: false },
  ],
};

export const FOLLOW_UPS = [
  { initials: "SK", name: "Sana K.", ref: "RBA-1046", reason: "Order sent on WhatsApp, not confirmed yet", age: "2 h" },
  { initials: "MA", name: "Maryam A.", ref: "Request #31", reason: "Waiting for your quote", age: "5 h" },
  { initials: "HR", name: "Hira R.", ref: "RBA-1039", reason: "Send progress photo", age: "1 d" },
  { initials: "ZB", name: "Zainab B.", ref: "RBA-1035", reason: "Approve design before pouring", age: "2 d" },
  { initials: "FA", name: "Fatima A.", ref: "RBA-1028", reason: "Delivered 3 days ago, ask for a review photo", age: "3 d" },
];

export const DUE_THIS_WEEK = [
  { what: "Nikkah tray set", who: "Ayesha H. · RBA-1042", when: "Mon 16 Nov" },
  { what: "Bouquet block", who: "Rabia S. · RBA-1037", when: "Wed 18 Nov" },
  { what: "4 name keychains", who: "Iqra M. · RBA-1044", when: "Fri 20 Nov" },
];

export const DASH_STATS = [
  { label: "New orders today", value: "5", sub: "2 waiting for your reply", href: "/admin/orders" },
  { label: "To make", value: "12", sub: "4 due this week", href: "/admin/orders" },
  { label: "Sales this month", value: "Rs 184,500", sub: "COD collected: Rs 141,200", href: "/admin/orders" },
  { label: "Custom requests", value: "3", sub: "1 needs a quote", href: "/admin/requests" },
];

export const CUSTOM_REQUESTS: CustomRequest[] = [
  { id: 31, name: "Maryam A.", phone: "0300 •••• 562", city: "Lahore", item: "Nikkah tray & pens", budget: "Rs 5,000–10,000", date: "20 Dec 2026", colours: "Ivory, Gold", status: "New", age: "5 h", received: "12 Nov, 2:10 pm",
    description: "Round tray with our names in Urdu and English, gold flakes around the edge, two pens to match. Our colours are ivory and dusty gold." },
  { id: 30, name: "Kiran S.", phone: "0321 •••• 401", city: "Karachi", item: "Flower preservation", budget: "Rs 10,000+", date: "—", colours: "Blush, Sage", status: "Quoted", age: "1 d", received: "11 Nov, 6:45 pm",
    description: "Bridal bouquet from last week, roses and baby’s breath. Would love a block or a frame for the wall." },
  { id: 29, name: "Usman T.", phone: "0333 •••• 287", city: "Islamabad", item: "Watch or clock", budget: "Rs 2,000–5,000", date: "1 Dec 2026", colours: "Ocean, Black", status: "Accepted", age: "2 d", received: "10 Nov, 11:20 am",
    description: "Wall clock for my parents’ anniversary with their names and wedding year." },
  { id: 28, name: "Areeba N.", phone: "0345 •••• 930", city: "Multan", item: "Keychain", budget: "Under Rs 2,000", date: "25 Nov 2026", colours: "Gold", status: "New", age: "3 d", received: "9 Nov, 8:05 pm",
    description: "10 name keychains for a bridal shower, each with a different name." },
  { id: 27, name: "Saad R.", phone: "0302 •••• 145", city: "Lahore", item: "Something else", budget: "Not sure yet", date: "—", colours: "—", status: "Declined", age: "5 d", received: "7 Nov, 4:30 pm",
    description: "Large resin river table, 6 feet long." },
];

export const REQUEST_STYLES: Record<CustomRequest["status"], string> = {
  New: "bg-st-new-bg text-st-new-fg",
  Quoted: "bg-st-progress-bg text-st-progress-fg",
  Accepted: "bg-st-done-bg text-st-done-fg",
  Declined: "bg-st-off-bg text-st-off-fg",
};

export const CUSTOMERS: Customer[] = [
  { name: "Ayesha H.", phone: "0301 •••• 776", city: "Lahore", orders: 2, spent: 11100, last: "10 Nov", tag: "Nikkah Feb" },
  { name: "Rabia S.", phone: "0345 •••• 019", city: "Multan", orders: 4, spent: 15900, last: "10 Nov", tag: "Repeat" },
  { name: "Sana K.", phone: "0300 •••• 214", city: "Lahore", orders: 1, spent: 2450, last: "12 Nov" },
  { name: "Amna T.", phone: "0321 •••• 880", city: "Karachi", orders: 1, spent: 7050, last: "12 Nov" },
  { name: "Iqra M.", phone: "0333 •••• 452", city: "Islamabad", orders: 3, spent: 6300, last: "11 Nov", tag: "Repeat" },
  { name: "Noor F.", phone: "0312 •••• 330", city: "Faisalabad", orders: 1, spent: 1350, last: "9 Nov" },
  { name: "Hamna Q.", phone: "0302 •••• 641", city: "Rawalpindi", orders: 2, spent: 10150, last: "9 Nov", tag: "Florals" },
  { name: "Hira R.", phone: "0322 •••• 905", city: "Lahore", orders: 5, spent: 9800, last: "8 Nov", tag: "Repeat" },
  { name: "Mehwish D.", phone: "0331 •••• 118", city: "Peshawar", orders: 1, spent: 0, last: "7 Nov" },
  { name: "Fatima A.", phone: "0311 •••• 520", city: "Karachi", orders: 2, spent: 4600, last: "5 Nov", tag: "Reviewer" },
];

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .replace(".", "")
    .slice(0, 2)
    .toUpperCase();
