import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyVoidPermission } from "@/lib/void-auth";
import { getThaiDatePrefix, nextDailySeqNumber } from "@/lib/doc-number";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.supplyItem.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const movements = await prisma.supplyMovement.findMany({
    include: { supplyItem: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({ items, movements });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "CREATE_ITEM") {
    const item = await prisma.supplyItem.create({
      data: {
        name: String(body.name).trim(),
        barcode: String(body.barcode ?? "").trim(),
        category: body.category || "ของใช้ในห้องพัก",
        unit: body.unit || "ชิ้น",
        cost: Number(body.cost ?? 0),
        stockQty: Number(body.stockQty ?? 0),
        minStock: Number(body.minStock ?? 10),
      },
    });
    return NextResponse.json({ item });
  }

  if (body.action === "MOVEMENT") {
    const { supplyItemId, type, quantity, roomNumber, department, notes } = body as {
      supplyItemId: string;
      type: "ISSUE" | "RESTOCK";
      quantity: number;
      roomNumber?: string;
      department?: string;
      notes?: string;
    };

    const qty = Number(quantity);
    if (qty <= 0) {
      return NextResponse.json({ error: "จำนวนต้องมากกว่า 0" }, { status: 400 });
    }

    const item = await prisma.supplyItem.findUnique({ where: { id: supplyItemId } });
    if (!item) {
      return NextResponse.json({ error: "ไม่พบรายการของใช้" }, { status: 404 });
    }

    if (type === "ISSUE" && item.stockQty < qty) {
      return NextResponse.json(
        { error: `สต็อกคงเหลือไม่พอ (เหลือ ${item.stockQty} ${item.unit})` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.supplyItem.update({
        where: { id: supplyItemId },
        data: {
          stockQty: type === "ISSUE" ? { decrement: qty } : { increment: qty },
        },
      });

      if (updatedItem.menuItemId) {
        await tx.menuItem.update({
          where: { id: updatedItem.menuItemId },
          data: { stockQty: updatedItem.stockQty },
        });
      }

      const movement = await tx.supplyMovement.create({
        data: {
          supplyItemId,
          type,
          quantity: qty,
          roomNumber: roomNumber || "",
          department: department || "แม่บ้าน",
          notes: notes || "",
          userName: user.name,
        },
        include: { supplyItem: true },
      });

      return { item: updatedItem, movement };
    });

    return NextResponse.json(result);
  }

  if (body.action === "BATCH_MOVEMENT") {
    const { type, roomNumber, department, notes, lines } = body as {
      type: "ISSUE" | "RESTOCK";
      roomNumber?: string;
      department?: string;
      notes?: string;
      lines: Array<{ supplyItemId: string; quantity: number }>;
    };

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกรายการของใช้" }, { status: 400 });
    }

    const cleanNotes = String(notes ?? "").trim();

    try {
      const { slipNo, movements } = await prisma.$transaction(async (tx) => {
        const datePrefix = getThaiDatePrefix();
        const docPrefix = type === "ISSUE" ? "ISS" : "RST";
        const existingMovements = await tx.supplyMovement.findMany({
          where: { notes: { contains: `${datePrefix}-` } },
          select: { notes: true },
        });
        const slipNo = nextDailySeqNumber(
          existingMovements.map((m) => m.notes),
          docPrefix
        );
        const noteText = cleanNotes ? `[${slipNo}] ${cleanNotes}` : `[${slipNo}]`;

        const created = [];
        for (const line of lines) {
          const qty = Math.max(1, Math.round(Number(line.quantity || 0)));
          const item = await tx.supplyItem.findUnique({ where: { id: line.supplyItemId } });
          if (!item) throw new Error("ไม่พบรายการของใช้");
          if (type === "ISSUE" && item.stockQty < qty) {
            throw new Error(`${item.name} คงเหลือไม่พอ (เหลือ ${item.stockQty} ${item.unit})`);
          }

          const updatedItem = await tx.supplyItem.update({
            where: { id: item.id },
            data: {
              stockQty: type === "ISSUE" ? { decrement: qty } : { increment: qty },
            },
          });

          if (updatedItem.menuItemId) {
            await tx.menuItem.update({
              where: { id: updatedItem.menuItemId },
              data: { stockQty: updatedItem.stockQty },
            });
          }

          const mv = await tx.supplyMovement.create({
            data: {
              supplyItemId: item.id,
              type,
              quantity: qty,
              roomNumber: roomNumber || "",
              department: department || "แม่บ้าน",
              notes: noteText,
              userName: user.name,
            },
            include: { supplyItem: true },
          });
          created.push(mv);
        }

        const itemSummary = created
          .map((mv) => `${mv.supplyItem.name} x${mv.quantity} ${mv.supplyItem.unit}`)
          .join(", ");
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: type === "ISSUE" ? "SUPPLY_ISSUE" : "SUPPLY_RESTOCK",
            entityType: "SupplySlip",
            entityId: slipNo,
            details: `${slipNo} (${department || "แม่บ้าน"}${roomNumber ? ` · ห้อง ${roomNumber}` : ""}): ${itemSummary}${cleanNotes ? ` | หมายเหตุ: ${cleanNotes}` : ""}`,
          },
        });

        return { slipNo, movements: created };
      });

      return NextResponse.json({ slipNo, movements });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
        { status: 400 }
      );
    }
  }

  if (body.action === "VOID_SLIP") {
    const hasVoid = await verifyVoidPermission(user.id);
    if (!hasVoid) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ยกเลิกใบเบิก (กรุณาติดต่อ Admin เพื่อเปิดสิทธิ์)" },
        { status: 403 }
      );
    }

    const { slipNo, movementIds, reason } = body as {
      slipNo?: string;
      movementIds?: string[];
      reason?: string;
    };
    const cleanReason = String(reason ?? "").trim();
    if (!cleanReason) {
      return NextResponse.json({ error: "กรุณาระบุเหตุผลในการยกเลิกใบเบิก" }, { status: 400 });
    }
    if (!Array.isArray(movementIds) || movementIds.length === 0) {
      return NextResponse.json({ error: "ไม่พบรายการใบเบิกที่ต้องการยกเลิก" }, { status: 400 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const mvs = await tx.supplyMovement.findMany({
          where: { id: { in: movementIds }, type: "ISSUE" },
          include: { supplyItem: true },
        });
        if (mvs.length === 0) {
          throw new Error("ไม่พบใบเบิก หรือใบเบิกนี้ถูกยกเลิกไปแล้ว");
        }

        const summaryParts: string[] = [];
        for (const mv of mvs) {
          const updatedItem = await tx.supplyItem.update({
            where: { id: mv.supplyItemId },
            data: { stockQty: { increment: mv.quantity } },
          });
          if (updatedItem.menuItemId) {
            await tx.menuItem.update({
              where: { id: updatedItem.menuItemId },
              data: { stockQty: updatedItem.stockQty },
            });
          }
          summaryParts.push(`${mv.supplyItem.name} x${mv.quantity} ${mv.supplyItem.unit}`);
        }

        await tx.supplyMovement.deleteMany({
          where: { id: { in: mvs.map((m) => m.id) } },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "SUPPLY_ISSUE_VOID",
            entityType: "SupplySlip",
            entityId: slipNo || mvs[0].id,
            details: `ยกเลิกใบเบิก ${slipNo || "-"} (${summaryParts.join(", ")}) · เหตุผล: ${cleanReason}`,
          },
        });
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "ยกเลิกใบเบิกไม่สำเร็จ" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.supplyItem.update({
    where: { id: body.id },
    data: {
      name: String(body.name).trim(),
      barcode: String(body.barcode ?? "").trim(),
      category: body.category,
      unit: body.unit,
      cost: Number(body.cost ?? 0),
      minStock: Number(body.minStock ?? 10),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await prisma.supplyItem.update({
    where: { id: body.id },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
