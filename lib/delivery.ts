/**
 * Delivery charges by city, from the admin Settings design.
 * Phase 2: editable in Admin → Settings → Delivery charges and read from the database.
 */
export const DELIVERY_ZONES = [
  { label: "Lahore", cities: ["Lahore"], charge: 250, days: "1–2" },
  { label: "Karachi", cities: ["Karachi"], charge: 300, days: "2–3" },
  { label: "Islamabad / Rawalpindi", cities: ["Islamabad", "Rawalpindi"], charge: 300, days: "2–3" },
  { label: "Other major cities", cities: ["Faisalabad", "Multan", "Peshawar"], charge: 350, days: "3–4" },
  { label: "Rest of Pakistan", cities: ["Other city"], charge: 400, days: "4–6" },
] as const;

export const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Other city"];

export function deliveryFor(city?: string) {
  if (!city) return undefined;
  const zone = DELIVERY_ZONES.find((z) => (z.cities as readonly string[]).includes(city));
  return zone ?? DELIVERY_ZONES[DELIVERY_ZONES.length - 1];
}
