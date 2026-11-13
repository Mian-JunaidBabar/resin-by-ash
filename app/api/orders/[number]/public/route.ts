import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public order receipt used by /thank-you when sessionStorage is unavailable.
 * Deliberately limited: no phone, address, notes or private data.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const digits = number.replace(/^\D+/, "").replace(/\D+$/, "");
  const parsed = Number(digits);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const order = await db.order.findUnique({
    where: { number: parsed },
    select: {
      number: true,
      name: true,
      subtotal: true,
      savings: true,
      delivery: true,
      total: true,
      status: true,
      createdAt: true,
      lines: { select: { name: true, qty: true, unitPrice: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json(
    {
      number: order.number,
      firstName: order.name.split(" ")[0],
      lines: order.lines.map((line) => ({ name: line.name, qty: line.qty, total: line.unitPrice * line.qty })),
      subtotal: order.subtotal,
      savings: order.savings,
      delivery: order.delivery,
      total: order.total,
      status: order.status,
      placedAt: order.createdAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
