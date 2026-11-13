import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const cell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function GET(request: Request) {
  await requireAdmin();
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q.replace(/\D/g, "") } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const customers = await db.customer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { orders: { select: { total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } } },
  });

  const header = ["Name", "Phone", "City", "Orders", "Total spent", "Last order", "Tag"];
  const rows = customers.map((customer) => {
    const spent = customer.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.total, 0);
    return [
      customer.name,
      customer.phone,
      customer.city ?? "",
      customer.orders.length,
      spent,
      customer.orders[0]?.createdAt.toISOString() ?? "",
      customer.tag ?? "",
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resin-by-ash-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
