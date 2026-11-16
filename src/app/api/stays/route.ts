import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateNights, hasDateOverlap } from "@/lib/pms-math";
import { getThaiDatePrefix, nextDailySeqNumber } from "@/lib/doc-number";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const stays = await prisma.stay.findMany({
    where: status ? { status } : undefined,
    include: {
      room: { include: { roomType: true } },
      guest: true,
      folio: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ stays });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const checkInDate = new Date(body.checkInDate);
    const checkOutDate = new Date(body.checkOutDate);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "วันเช็กเอาท์ต้องมากกว่าวันเช็กอิน" },
        { status: 400 }
      );
    }

    // Check overlapping active stays for this room
    const existingStays = await prisma.stay.findMany({
      where: {
        roomId: body.roomId,
        status: { in: ["RESERVED", "CHECKED_IN"] },
      },
    });

    const conflict = existingStays.find((s) =>
      hasDateOverlap(checkInDate, checkOutDate, s.checkInDate, s.checkOutDate)
    );
    if (conflict) {
      return NextResponse.json(
        { error: `ห้องนี้มีการจองซ้อนทับกับรหัส ${conflict.bookingCode}` },
        { status: 409 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: body.roomId },
      include: { roomType: true },
    });
    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องพัก" }, { status: 404 });
    }

    // Create or reuse guest
    let guestId = body.guestId as string | undefined;
    if (!guestId) {
      const trimmedName = String(body.guestName ?? "").trim();
      const trimmedPhone = String(body.guestPhone ?? "").trim() || "-";
      const trimmedId = String(body.idNumber ?? "").trim();
      const existingGuest = await prisma.guest.findFirst({
        where: trimmedId
          ? { OR: [{ idNumber: trimmedId }, { fullName: trimmedName, phone: trimmedPhone }] }
          : { fullName: trimmedName, phone: trimmedPhone },
      });
      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const guest = await prisma.guest.create({
          data: {
            fullName: trimmedName,
            phone: trimmedPhone,
            idType: body.idType || "THAI_ID",
            idNumber: trimmedId,
            nationality: body.nationality || "Thai",
            vehiclePlate: body.vehiclePlate || "",
          },
        });
        guestId = guest.id;
      }
    }

    const stayType =
      body.stayType === "MONTHLY"
        ? "MONTHLY"
        : body.stayType === "SHORT_TIME"
          ? "SHORT_TIME"
          : "DAILY";
    const trimmedInputId = String(body.idNumber ?? "").trim();
    let effectiveIdNumber = trimmedInputId;
    if (!effectiveIdNumber && guestId) {
      const g = await prisma.guest.findUnique({
        where: { id: guestId },
        select: { idNumber: true },
      });
      effectiveIdNumber = g?.idNumber?.trim() || "";
    }

    const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });
    if (stayType === "SHORT_TIME" && setting && !setting.enableShortTime) {
      return NextResponse.json(
        { error: "ระบบปิดใช้งานการเข้าพักชั่วคราวไว้ในตั้งค่าระบบ" },
        { status: 400 }
      );
    }
    if (stayType === "MONTHLY" && setting && !setting.enableMonthly) {
      return NextResponse.json(
        { error: "ระบบปิดใช้งานการเช่ารายเดือนไว้ในตั้งค่าระบบ" },
        { status: 400 }
      );
    }
    const shortTimeHours = setting?.shortTimeHours ?? 3;
    const isCheckInNow = Boolean(body.checkInNow);
    const hasTaxCard = stayType === "DAILY" && /^\d{13}$/.test(effectiveIdNumber);
    const taxCardDiscount = hasTaxCard ? 50 : 0;
    const rateAmount =
      stayType === "MONTHLY"
        ? room.roomType.baseMonthlyRate
        : stayType === "SHORT_TIME"
          ? (setting?.shortTimeRate ?? 400)
          : Math.max(0, room.roomType.baseDailyRate - taxCardDiscount);
    const depositAmount = Number(body.depositAmount ?? 0);
    const securityDeposit = Number(body.securityDeposit ?? 0);
    const keyDeposit = Math.max(0, Number(setting?.defaultKeyDeposit ?? 200));
    const keyDepositMethod = String(body.keyDepositMethod || "CASH");

    const nights = stayType === "DAILY" ? calculateNights(checkInDate, checkOutDate) : 1;
    const initialRoomCharge = stayType === "DAILY" ? rateAmount * nights : rateAmount;
    const collectFullPayment = Boolean(body.collectFullPayment);
    const totalCharges = initialRoomCharge + keyDeposit;
    const fullPayDueNow = collectFullPayment
      ? Math.max(0, totalCharges - depositAmount)
      : 0;
    const totalPayments = depositAmount + fullPayDueNow;
    const initialPayments = [
      ...(depositAmount > 0
        ? [
            {
              amount: depositAmount,
              method: body.depositMethod || "TRANSFER",
              referenceNo: "",
              receivedById: user.id,
            },
          ]
        : []),
      ...(fullPayDueNow > 0
        ? [
            {
              amount: fullPayDueNow,
              method: String(body.paymentMethod || "CASH"),
              referenceNo: String(body.paymentReferenceNo || ""),
              receivedById: user.id,
            },
          ]
        : []),
    ];

    const stay = await prisma.$transaction(async (tx) => {
      const datePrefix = getThaiDatePrefix();
      const existingStays = await tx.stay.findMany({
        where: { bookingCode: { contains: `${datePrefix}-` } },
        select: { bookingCode: true },
      });
      const bookingCode = nextDailySeqNumber(
        existingStays.map((s) => s.bookingCode),
        stayType === "MONTHLY" ? "MTH" : stayType === "SHORT_TIME" ? "SHT" : "BKG"
      );

      const created = await tx.stay.create({
        data: {
          bookingCode,
          stayType,
          status: isCheckInNow ? "CHECKED_IN" : "RESERVED",
          roomId: room.id,
          guestId,
          checkInDate,
          checkOutDate,
          actualCheckIn: isCheckInNow ? new Date() : null,
          rateAmount,
          depositAmount,
          securityDeposit,
          keyDeposit,
          keyDepositMethod,
          keyDepositStatus: keyDeposit > 0 ? "HELD" : "NONE",
          adults: Number(body.adults ?? 1),
          children: Number(body.children ?? 0),
          notes: body.notes ?? "",
          folio: {
            create: {
              status: "OPEN",
              totalCharges,
              totalPayments,
              balance: totalCharges - totalPayments,
              items: {
                create: [
                  {
                    category: "ROOM_CHARGE",
                    description:
                      stayType === "MONTHLY"
                        ? `ค่าเช่าห้อง ${room.roomNumber} (รายเดือน)`
                        : stayType === "SHORT_TIME"
                          ? `ค่าห้องชั่วคราว ${room.roomNumber} (${shortTimeHours} ชม.)`
                          : `ค่าห้องพัก ${room.roomNumber} (${nights} คืน${hasTaxCard ? " · บัตรผู้เสียภาษี" : ""})`,
                    quantity: nights,
                    unitPrice: rateAmount,
                    amount: initialRoomCharge,
                  },
                  ...(keyDeposit > 0
                    ? [
                        {
                          category: "KEY_DEPOSIT",
                          description: `ค่ามัดจำกุญแจห้อง ${room.roomNumber}`,
                          quantity: 1,
                          unitPrice: keyDeposit,
                          amount: keyDeposit,
                        },
                      ]
                    : []),
                ],
              },
              ...(initialPayments.length > 0
                ? {
                    payments: {
                      create: initialPayments.map((p) => ({
                        amount: p.amount,
                        method: p.method,
                        referenceNo: p.referenceNo || bookingCode,
                        receivedById: p.receivedById,
                      })),
                    },
                  }
                : {}),
            },
          },
        },
        include: {
          room: true,
          guest: true,
          folio: { include: { items: { orderBy: { createdAt: "asc" } } } },
        },
      });

      if (isCheckInNow) {
        await tx.room.update({
          where: { id: room.id },
          data: { status: "OC" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: isCheckInNow ? "CHECK_IN" : "CREATE_BOOKING",
          entityType: "Stay",
          entityId: bookingCode,
          details: `${bookingCode} ห้อง ${room.roomNumber} (${stayType})${hasTaxCard ? " · บัตรผู้เสียภาษี (-฿50/คืน)" : ""}${keyDeposit > 0 ? ` · รับมัดจำกุญแจ ฿${keyDeposit.toLocaleString()} (${keyDepositMethod === "CASH" ? "เงินสด" : "เงินโอน"})` : ""}`,
        },
      });

      return created;
    });

    return NextResponse.json({ stay });
  } catch (err) {
    console.error("Create stay error:", err);
    return NextResponse.json({ error: "สร้างรายการเข้าพักไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    stayId,
    action,
    newRoomId,
    extendHours,
    extraCharge,
    keyDepositAction,
    keyDepositRefunded,
    keyDepositRefundMethod,
  } = body as {
    stayId: string;
    action: "CHECK_IN" | "CHECK_OUT" | "CANCEL" | "ROOM_MOVE" | "EXTEND_SHORT_TIME";
    newRoomId?: string;
    extendHours?: number;
    extraCharge?: number;
    keyDepositAction?: "RETURN" | "FORFEIT";
    keyDepositRefunded?: number;
    keyDepositRefundMethod?: string;
  };

  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    include: { room: true, folio: true },
  });

  if (!stay) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการเข้าพัก" }, { status: 404 });
  }

  if (action === "CHECK_IN") {
    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.stay.update({
        where: { id: stayId },
        data: { status: "CHECKED_IN", actualCheckIn: new Date() },
      });
      await tx.room.update({
        where: { id: stay.roomId },
        data: { status: "OC" },
      });
      return s;
    });
    return NextResponse.json({ stay: updated });
  }

  if (action === "CHECK_OUT") {
    const hasHeldKeyDeposit = stay.keyDeposit > 0 && stay.keyDepositStatus === "HELD";
    const refundMethod = String(keyDepositRefundMethod || "CASH");
    const refundAmount = hasHeldKeyDeposit
      ? keyDepositAction === "FORFEIT"
        ? Math.max(0, Math.min(stay.keyDeposit, Number(keyDepositRefunded ?? 0)))
        : Math.max(0, Math.min(stay.keyDeposit, Number(keyDepositRefunded ?? stay.keyDeposit)))
      : 0;
    const nextKeyStatus = hasHeldKeyDeposit
      ? keyDepositAction === "FORFEIT" || refundAmount < stay.keyDeposit
        ? "FORFEITED"
        : "RETURNED"
      : stay.keyDepositStatus;

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.stay.update({
        where: { id: stayId },
        data: {
          status: "CHECKED_OUT",
          actualCheckOut: new Date(),
          ...(hasHeldKeyDeposit
            ? {
                keyDepositStatus: nextKeyStatus,
                keyDepositRefunded: refundAmount,
                keyDepositRefundMethod: refundMethod,
                keyDepositRefundedAt: new Date(),
              }
            : {}),
        },
      });
      await tx.room.update({
        where: { id: stay.roomId },
        data: { status: "VD" },
      });
      await tx.housekeepingTask.create({
        data: {
          roomId: stay.roomId,
          type: "CLEANING",
          priority: "HIGH",
          status: "PENDING",
          notes: `ทำความสะอาดหลังแขก Check-out (${stay.bookingCode})`,
        },
      });
      if (stay.folio) {
        let nextTotalCharges = stay.folio.totalCharges;
        let nextTotalPayments = stay.folio.totalPayments;

        if (hasHeldKeyDeposit && refundAmount > 0) {
          await tx.folioItem.create({
            data: {
              folioId: stay.folio.id,
              category: "KEY_DEPOSIT",
              description: `คืนค่ามัดจำกุญแจห้อง ${stay.room.roomNumber}`,
              quantity: 1,
              unitPrice: -refundAmount,
              amount: -refundAmount,
            },
          });
          nextTotalCharges -= refundAmount;

          const paymentToRefund = Math.min(
            refundAmount,
            Math.max(0, stay.folio.totalPayments - nextTotalCharges)
          );
          if (paymentToRefund > 0) {
            const existingPayments = await tx.payment.findMany({
              where: { folioId: stay.folio.id },
              select: { source: true, method: true },
            });
            const hasFrontDeskMoney = existingPayments.some(
              (p) => p.source === "FRONT_DESK" && p.method !== "CREDIT_CARD"
            );
            const hasFolioMoney = existingPayments.some((p) => p.source === "FOLIO");
            const refundSource =
              hasFolioMoney && !hasFrontDeskMoney ? "FOLIO" : "FRONT_DESK";

            await tx.payment.create({
              data: {
                folioId: stay.folio.id,
                amount: -paymentToRefund,
                method: refundMethod,
                referenceNo: `KEY-REFUND-${stay.bookingCode}`,
                source: refundSource,
                receivedById: user.id,
              },
            });
            nextTotalPayments -= paymentToRefund;
          }
        }

        const nextBalance = nextTotalCharges - nextTotalPayments;
        await tx.folio.update({
          where: { id: stay.folio.id },
          data: {
            totalCharges: nextTotalCharges,
            totalPayments: nextTotalPayments,
            balance: nextBalance,
            ...(nextBalance <= 0 ? { status: "CLOSED" } : {}),
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CHECK_OUT",
          entityType: "Stay",
          entityId: stay.bookingCode,
          details: `${stay.bookingCode} ห้อง ${stay.room.roomNumber} Check-out${
            hasHeldKeyDeposit
              ? nextKeyStatus === "RETURNED"
                ? ` · คืนมัดจำกุญแจ ฿${refundAmount.toLocaleString()} (${refundMethod === "CASH" ? "เงินสด" : "เงินโอน"})`
                : ` · ยึด/หักมัดจำกุญแจ (คืนจริง ฿${refundAmount.toLocaleString()} จาก ฿${stay.keyDeposit.toLocaleString()})`
              : ""
          }`,
        },
      });
      return s;
    });
    return NextResponse.json({ stay: updated });
  }

  if (action === "CANCEL") {
    const updated = await prisma.stay.update({
      where: { id: stayId },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ stay: updated });
  }

  if (action === "ROOM_MOVE" && newRoomId) {
    const targetRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
    if (!targetRoom || targetRoom.status !== "VC") {
      return NextResponse.json(
        { error: "ห้องปลายทางต้องอยู่ในสถานะว่างสะอาด (VC)" },
        { status: 400 }
      );
    }
    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.stay.update({
        where: { id: stayId },
        data: { roomId: newRoomId },
      });
      await tx.room.update({ where: { id: stay.roomId }, data: { status: "VD" } });
      await tx.room.update({ where: { id: newRoomId }, data: { status: "OC" } });
      return s;
    });
    return NextResponse.json({ stay: updated });
  }

  if (action === "EXTEND_SHORT_TIME") {
    const hrs = Math.max(1, Number(extendHours ?? 1));
    const charge = Math.max(0, Number(extraCharge ?? 0));
    const nextCheckOut = new Date(stay.checkOutDate.getTime() + hrs * 3600 * 1000);

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.stay.update({
        where: { id: stayId },
        data: { checkOutDate: nextCheckOut },
      });
      if (charge > 0 && stay.folio) {
        await tx.folioItem.create({
          data: {
            folioId: stay.folio.id,
            category: "ROOM_CHARGE",
            description: `ต่อเวลาห้องชั่วคราว ${stay.room.roomNumber} (+${hrs} ชม.)`,
            quantity: hrs,
            unitPrice: Number((charge / hrs).toFixed(2)),
            amount: charge,
          },
        });
        await tx.folio.update({
          where: { id: stay.folio.id },
          data: {
            status: "OPEN",
            totalCharges: { increment: charge },
            balance: { increment: charge },
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "EXTEND_SHORT_TIME",
          entityType: "Stay",
          entityId: stay.bookingCode,
          details: `${stay.bookingCode} ห้อง ${stay.room.roomNumber} ต่อเวลา +${hrs} ชม.${charge > 0 ? ` (เพิ่ม ฿${charge.toLocaleString()})` : ""}`,
        },
      });
      return s;
    });
    return NextResponse.json({ stay: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
