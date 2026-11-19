import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateTaxAndService } from "@/lib/pms-math";
import { getThaiDatePrefix, nextDailySeqNumber } from "@/lib/doc-number";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.menuCategory.findMany({
    include: { items: { where: { active: true }, orderBy: { name: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  const tables = await prisma.diningTable.findMany({ orderBy: { tableNumber: "asc" } });
  const activeStays = await prisma.stay.findMany({
    where: { status: "CHECKED_IN" },
    include: { room: true, guest: true, folio: true },
    orderBy: { room: { roomNumber: "asc" } },
  });
  const orders = await prisma.posOrder.findMany({
    include: {
      table: true,
      stay: { include: { room: true, guest: true } },
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

  return NextResponse.json({ categories, tables, activeStays, orders, setting });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "CREATE_CATEGORY") {
    const category = await prisma.menuCategory.create({
      data: {
        name: String(body.name).trim(),
        station: body.station || "KITCHEN",
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });
    return NextResponse.json({ category });
  }

  if (body.action === "CREATE_MENU_ITEM") {
    const item = await prisma.menuItem.create({
      data: {
        categoryId: body.categoryId,
        barcode: String(body.barcode ?? "").trim(),
        name: body.name,
        price: Number(body.price),
        cost: Number(body.cost ?? 0),
        stockQty: Number(body.stockQty ?? 0),
        trackStock: Boolean(body.trackStock),
        isMinibar: Boolean(body.isMinibar),
      },
    });
    return NextResponse.json({ item });
  }

  if (body.action === "CREATE_ORDER") {
    const { orderType, tableId, stayId, items, settleNow, paymentMethod } = body as {
      orderType: "DINE_IN" | "ROOM_SERVICE" | "TAKEAWAY" | "MINIBAR";
      tableId?: string;
      stayId?: string;
      items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
      settleNow?: "PAY_DIRECT" | "CHARGE_TO_ROOM";
      paymentMethod?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกรายการอาหาร/สินค้า" }, { status: 400 });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
    });
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const orderItemsData = items.map((i) => {
      const m = menuMap.get(i.menuItemId);
      if (!m) throw new Error("ไม่พบเมนูที่เลือก");
      subtotal += m.price * i.quantity;
      return {
        menuItemId: m.id,
        quantity: i.quantity,
        unitPrice: m.price,
        notes: i.notes ?? "",
        stationStatus: orderType === "MINIBAR" ? "SERVED" : "PENDING",
      };
    });

    const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });
    const vatRate = setting?.vatRate ?? 0;
    // Retail / POS prices are VAT-inclusive so totalAmount matches shelf price
    const vatAmount =
      vatRate > 0
        ? Number((subtotal - subtotal / (1 + vatRate / 100)).toFixed(2))
        : 0;
    const tax = {
      serviceChargeAmount: 0,
      vatAmount,
      totalAmount: Number(subtotal.toFixed(2)),
    };

    const order = await prisma.$transaction(async (tx) => {
      const datePrefix = getThaiDatePrefix();
      const existingOrders = await tx.posOrder.findMany({
        where: { orderNumber: { contains: `${datePrefix}-` } },
        select: { orderNumber: true },
      });
      const orderNumber = nextDailySeqNumber(
        existingOrders.map((o) => o.orderNumber),
        "POS"
      );

      let initialStatus = orderType === "MINIBAR" ? "SERVED" : "PENDING";
      if (settleNow === "PAY_DIRECT") initialStatus = "PAID";
      if (settleNow === "CHARGE_TO_ROOM") initialStatus = "CHARGED_TO_ROOM";

      const created = await tx.posOrder.create({
        data: {
          orderNumber,
          orderType,
          status: initialStatus,
          tableId: tableId || null,
          stayId: stayId || null,
          subtotal,
          vatAmount: tax.vatAmount,
          serviceChargeAmount: tax.serviceChargeAmount,
          totalAmount: tax.totalAmount,
          createdById: user.id,
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } } },
      });

      // Deduct stock if tracked
      for (const i of items) {
        const m = menuMap.get(i.menuItemId);
        if (m?.trackStock) {
          await tx.menuItem.update({
            where: { id: m.id },
            data: { stockQty: { decrement: i.quantity } },
          });
          await tx.supplyItem.updateMany({
            where: { menuItemId: m.id },
            data: { stockQty: { decrement: i.quantity } },
          });
        }
      }

      if (tableId && !settleNow) {
        await tx.diningTable.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });
      }

      if (settleNow === "PAY_DIRECT") {
        await tx.payment.create({
          data: {
            posOrderId: created.id,
            amount: tax.totalAmount,
            method: paymentMethod || "CASH",
            receivedById: user.id,
          },
        });
      }

      if (settleNow === "CHARGE_TO_ROOM" && stayId) {
        const stay = await tx.stay.findUnique({
          where: { id: stayId },
          include: { folio: true, room: true },
        });
        if (!stay?.folio) {
          throw new Error("ไม่พบ Folio ของห้องพักนี้");
        }
        const category = orderType === "MINIBAR" ? "MINIBAR" : "POS_FOOD";
        const descPrefix = orderType === "MINIBAR" ? "มินิบาร์" : "ห้องอาหาร POS";
        await tx.folioItem.create({
          data: {
            folioId: stay.folio.id,
            category,
            description: `${descPrefix} (${orderNumber})`,
            quantity: 1,
            unitPrice: tax.totalAmount,
            amount: tax.totalAmount,
            vatAmount: tax.vatAmount,
            serviceChargeAmount: tax.serviceChargeAmount,
            posOrderId: created.id,
          },
        });
        await tx.folio.update({
          where: { id: stay.folio.id },
          data: {
            totalCharges: { increment: tax.totalAmount },
            balance: { increment: tax.totalAmount },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "POS_ORDER_CREATE",
          entityType: "PosOrder",
          entityId: orderNumber,
          details: `สร้างบิล ${orderNumber} (${orderType}) ยอดรวม ฿${tax.totalAmount.toLocaleString()}${settleNow ? ` · ชำระ: ${settleNow === "PAY_DIRECT" ? paymentMethod || "CASH" : "เข้าบิลห้องพัก"}` : ""}`,
        },
      });

      return created;
    });

    return NextResponse.json({ order });
  }

  if (body.action === "SETTLE_ORDER") {
    const { orderId, settleType, paymentMethod, stayId } = body as {
      orderId: string;
      settleType: "PAY_DIRECT" | "CHARGE_TO_ROOM";
      paymentMethod?: string;
      stayId?: string;
    };

    const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (settleType === "PAY_DIRECT") {
        await tx.payment.create({
          data: {
            posOrderId: order.id,
            amount: order.totalAmount,
            method: paymentMethod || "CASH",
            receivedById: user.id,
          },
        });
        await tx.posOrder.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });
      } else if (settleType === "CHARGE_TO_ROOM") {
        const targetStayId = stayId || order.stayId;
        if (!targetStayId) throw new Error("กรุณาเลือกห้องพัก");
        const stay = await tx.stay.findUnique({
          where: { id: targetStayId },
          include: { folio: true },
        });
        if (!stay?.folio) throw new Error("ไม่พบ Folio ของห้องพัก");

        await tx.folioItem.create({
          data: {
            folioId: stay.folio.id,
            category: order.orderType === "MINIBAR" ? "MINIBAR" : "POS_FOOD",
            description: `ห้องอาหาร POS (${order.orderNumber})`,
            quantity: 1,
            unitPrice: order.totalAmount,
            amount: order.totalAmount,
            posOrderId: order.id,
          },
        });
        await tx.folio.update({
          where: { id: stay.folio.id },
          data: {
            totalCharges: { increment: order.totalAmount },
            balance: { increment: order.totalAmount },
          },
        });
        await tx.posOrder.update({
          where: { id: order.id },
          data: { status: "CHARGED_TO_ROOM", stayId: targetStayId },
        });
      }

      if (order.tableId) {
        await tx.diningTable.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "VOID_ORDER") {
    const { orderId, reason } = body as { orderId?: string; reason?: string };
    const cleanReason = String(reason ?? "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "ไม่พบรหัสบิลที่ต้องการยกเลิก" }, { status: 400 });
    }
    if (!cleanReason) {
      return NextResponse.json({ error: "กรุณาระบุเหตุผลในการยกเลิกบิล" }, { status: 400 });
    }

    const isAdminOrManager = ["OWNER", "MANAGER", "ADMIN"].includes(user.role);
    if (!isAdminOrManager) {
      return NextResponse.json(
        { error: "เฉพาะ Admin / Manager เท่านั้นที่มีสิทธิ์ยกเลิกบิล POS" },
        { status: 403 }
      );
    }

    const existing = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        stay: { include: { folio: true, room: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบบิล POS ที่ต้องการยกเลิก" }, { status: 404 });
    }
    if (existing.status === "CANCELLED") {
      return NextResponse.json({ error: "บิลนี้ถูกยกเลิกไปแล้ว" }, { status: 400 });
    }

    if (existing.status === "CHARGED_TO_ROOM" && existing.stay && existing.stay.status !== "CHECKED_IN") {
      return NextResponse.json(
        { error: "ห้องพักนี้ Check-out ปิดบิลไปแล้ว ไม่สามารถยกเลิกบิล POS นี้ได้" },
        { status: 400 }
      );
    }

    try {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // 1. Restore stock for tracked items
        for (const item of existing.items) {
          if (item.menuItem.trackStock) {
            await tx.menuItem.update({
              where: { id: item.menuItemId },
              data: { stockQty: { increment: item.quantity } },
            });
            await tx.supplyItem.updateMany({
              where: { menuItemId: item.menuItemId },
              data: { stockQty: { increment: item.quantity } },
            });
          }
        }

        // 2. Remove direct payments tied to this POS order
        await tx.payment.deleteMany({
          where: { posOrderId: existing.id },
        });

        // 3. Revert room folio charge if charged to room
        if (existing.status === "CHARGED_TO_ROOM" && existing.stay?.folio) {
          const folioItems = await tx.folioItem.findMany({
            where: { posOrderId: existing.id },
          });
          const revertAmount = folioItems.reduce((sum, fi) => sum + fi.amount, 0);
          if (folioItems.length > 0) {
            await tx.folioItem.deleteMany({
              where: { posOrderId: existing.id },
            });
            await tx.folio.update({
              where: { id: existing.stay.folio.id },
              data: {
                totalCharges: { decrement: revertAmount },
                balance: { decrement: revertAmount },
              },
            });
          }
        }

        // 4. Release table if it was an open dine-in order
        if (existing.tableId && existing.status === "PENDING") {
          await tx.diningTable.update({
            where: { id: existing.tableId },
            data: { status: "AVAILABLE" },
          });
        }

        const voidNote = `[VOID โดย ${user.name}: ${cleanReason}]`;
        const nextNotes = existing.notes ? `${existing.notes}\n${voidNote}` : voidNote;

        const updated = await tx.posOrder.update({
          where: { id: existing.id },
          data: {
            status: "CANCELLED",
            notes: nextNotes,
          },
          include: {
            table: true,
            stay: { include: { room: true, guest: true } },
            items: { include: { menuItem: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "POS_ORDER_VOID",
            entityType: "PosOrder",
            entityId: existing.orderNumber,
            details: `ยกเลิกบิล ${existing.orderNumber} (ยอด ฿${existing.totalAmount.toLocaleString()}) · เหตุผล: ${cleanReason}`,
          },
        });

        return updated;
      });

      return NextResponse.json({ order: updatedOrder });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ยกเลิกบิลไม่สำเร็จ";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "UPDATE_CATEGORY") {
    const category = await prisma.menuCategory.update({
      where: { id: body.id },
      data: {
        name: String(body.name).trim(),
        station: body.station || "KITCHEN",
      },
    });
    return NextResponse.json({ category });
  }

  if (body.action === "UPDATE_MENU_ITEM") {
    const item = await prisma.menuItem.update({
      where: { id: body.id },
      data: {
        categoryId: body.categoryId,
        barcode: String(body.barcode ?? "").trim(),
        name: body.name,
        price: Number(body.price),
        cost: Number(body.cost ?? 0),
        trackStock: Boolean(body.trackStock),
        stockQty: Boolean(body.trackStock) ? Number(body.stockQty ?? 0) : 0,
        isMinibar: Boolean(body.isMinibar),
      },
    });
    return NextResponse.json({ item });
  }

  const order = await prisma.posOrder.update({
    where: { id: body.orderId },
    data: { status: body.status },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "POS_ORDER_STATUS",
      entityType: "PosOrder",
      entityId: order.orderNumber,
      details: `เปลี่ยนสถานะบิล ${order.orderNumber} เป็น ${body.status}`,
    },
  });
  return NextResponse.json({ order });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.action === "DELETE_CATEGORY") {
    const itemCount = await prisma.menuItem.count({
      where: { categoryId: body.id, active: true },
    });
    if (itemCount > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบหมวดหมู่ที่ยังมีสินค้าอยู่ได้" },
        { status: 400 }
      );
    }
    await prisma.menuItem.deleteMany({ where: { categoryId: body.id, active: false } });
    await prisma.menuCategory.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "DELETE_MENU_ITEM") {
    const usedCount = await prisma.posOrderItem.count({
      where: { menuItemId: body.id },
    });
    if (usedCount > 0) {
      await prisma.menuItem.update({
        where: { id: body.id },
        data: { active: false },
      });
    } else {
      await prisma.menuItem.delete({ where: { id: body.id } });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
