import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateTaxAndService } from "@/lib/pms-math";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [folios, setting] = await Promise.all([
    prisma.folio.findMany({
      include: {
        stay: {
          include: {
            room: true,
            guest: true,
          },
        },
        items: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { paidAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.propertySetting.findUnique({ where: { id: 1 } }),
  ]);

  return NextResponse.json({ folios, setting });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "ADD_CHARGE") {
    const { folioId, category, description, quantity, unitPrice, applyTax } = body;
    const qty = Number(quantity ?? 1);
    const price = Number(unitPrice);
    const subtotal = qty * price;

    const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });
    const tax = applyTax
      ? calculateTaxAndService(
          subtotal,
          setting?.vatRate ?? 7,
          setting?.serviceChargeRate ?? 0
        )
      : { serviceChargeAmount: 0, vatAmount: 0, totalAmount: subtotal };

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.folioItem.create({
        data: {
          folioId,
          category: category || "OTHER",
          description,
          quantity: qty,
          unitPrice: price,
          amount: tax.totalAmount,
          vatAmount: tax.vatAmount,
          serviceChargeAmount: tax.serviceChargeAmount,
        },
      });

      const folio = await tx.folio.update({
        where: { id: folioId },
        data: {
          totalCharges: { increment: tax.totalAmount },
          balance: { increment: tax.totalAmount },
        },
      });

      return { item, folio };
    });

    return NextResponse.json(result);
  }

  if (body.action === "RECORD_PAYMENT") {
    const { folioId, amount, method, referenceNo, source } = body;
    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return NextResponse.json({ error: "ยอดชำระต้องมากกว่า 0" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          folioId,
          amount: payAmount,
          method: method || "CASH",
          referenceNo: referenceNo || "",
          source: source === "FOLIO" ? "FOLIO" : "FRONT_DESK",
          receivedById: user.id,
        },
      });

      const current = await tx.folio.findUnique({ where: { id: folioId } });
      const newBalance = Number(((current?.balance ?? 0) - payAmount).toFixed(2));

      const folio = await tx.folio.update({
        where: { id: folioId },
        data: {
          totalPayments: { increment: payAmount },
          balance: newBalance,
        },
        include: {
          items: { orderBy: { createdAt: "asc" } },
        },
      });

      return { payment, folio };
    });

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
