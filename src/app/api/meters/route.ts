import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateUtilityCharge } from "@/lib/pms-math";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const billingMonth =
    req.nextUrl.searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const rooms = await prisma.room.findMany({
    include: {
      roomType: true,
      stays: {
        where: { status: "CHECKED_IN" },
        include: { guest: true, folio: true },
        take: 1,
      },
    },
    orderBy: { roomNumber: "asc" },
  });
  const readings = await prisma.utilityMeter.findMany({
    where: { billingMonth },
  });
  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

  return NextResponse.json({ rooms, readings, setting, billingMonth });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { roomId, billingMonth, currWater, currElectric, postToFolio } = body as {
      roomId: string;
      billingMonth: string;
      currWater: number;
      currElectric: number;
      postToFolio?: boolean;
    };

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        stays: {
          where: { status: "CHECKED_IN" },
          include: { folio: true },
          take: 1,
        },
      },
    });
    const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องพัก" }, { status: 404 });
    }

    const waterRate = setting?.waterRatePerUnit ?? 18;
    const waterMin = setting?.waterMinUnits ?? 0;
    const electricRate = setting?.electricRatePerUnit ?? 7;
    const electricMin = setting?.electricMinUnits ?? 0;

    const water = calculateUtilityCharge(
      room.lastWaterMeter,
      Number(currWater),
      waterRate,
      waterMin
    );
    const electric = calculateUtilityCharge(
      room.lastElectricMeter,
      Number(currElectric),
      electricRate,
      electricMin
    );

    const activeStay = room.stays[0];

    const reading = await prisma.$transaction(async (tx) => {
      const saved = await tx.utilityMeter.upsert({
        where: { roomId_billingMonth: { roomId, billingMonth } },
        update: {
          currWater: Number(currWater),
          waterUnits: water.units,
          waterAmount: water.amount,
          currElectric: Number(currElectric),
          electricUnits: electric.units,
          electricAmount: electric.amount,
          billed: Boolean(postToFolio && activeStay?.folio),
          recordedById: user.id,
        },
        create: {
          roomId,
          stayId: activeStay?.id ?? null,
          billingMonth,
          prevWater: room.lastWaterMeter,
          currWater: Number(currWater),
          waterUnits: water.units,
          waterAmount: water.amount,
          prevElectric: room.lastElectricMeter,
          currElectric: Number(currElectric),
          electricUnits: electric.units,
          electricAmount: electric.amount,
          billed: Boolean(postToFolio && activeStay?.folio),
          recordedById: user.id,
        },
      });

      await tx.room.update({
        where: { id: roomId },
        data: {
          lastWaterMeter: Number(currWater),
          lastElectricMeter: Number(currElectric),
        },
      });

      if (postToFolio && activeStay?.folio) {
        const folioId = activeStay.folio.id;
        await tx.folioItem.createMany({
          data: [
            {
              folioId,
              category: "WATER",
              description: `ค่าน้ำประปา (${billingMonth}) ${room.lastWaterMeter}→${currWater} (${water.units} หน่วย)`,
              quantity: Math.max(water.units, waterMin),
              unitPrice: waterRate,
              amount: water.amount,
            },
            {
              folioId,
              category: "ELECTRIC",
              description: `ค่าไฟฟ้า (${billingMonth}) ${room.lastElectricMeter}→${currElectric} (${electric.units} หน่วย)`,
              quantity: Math.max(electric.units, electricMin),
              unitPrice: electricRate,
              amount: electric.amount,
            },
          ],
        });

        const addedTotal = water.amount + electric.amount;
        await tx.folio.update({
          where: { id: folioId },
          data: {
            totalCharges: { increment: addedTotal },
            balance: { increment: addedTotal },
          },
        });
      }

      return saved;
    });

    return NextResponse.json({ reading });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "บันทึกมิเตอร์ไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
