import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { invalidateHotelNameCache } from "@/lib/require-session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [setting, roomTypes, rooms] = await Promise.all([
    prisma.propertySetting.findUnique({ where: { id: 1 } }),
    prisma.roomType.findMany({ orderBy: { code: "asc" } }),
    prisma.room.findMany({ include: { roomType: true }, orderBy: { roomNumber: "asc" } }),
  ]);

  return NextResponse.json({ setting, roomTypes, rooms });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.propertySetting.upsert({
    where: { id: 1 },
    update: {
      hotelName: body.hotelName,
      taxId: body.taxId ?? "",
      address: body.address ?? "",
      phone: body.phone ?? "",
      vatRate: Number(body.vatRate ?? 7),
      serviceChargeRate: Number(body.serviceChargeRate ?? 0),
      waterRatePerUnit: Number(body.waterRatePerUnit ?? 18),
      waterMinUnits: Number(body.waterMinUnits ?? 0),
      electricRatePerUnit: Number(body.electricRatePerUnit ?? 7),
      electricMinUnits: Number(body.electricMinUnits ?? 0),
      checkInTime: body.checkInTime ?? "14:00",
      checkOutTime: body.checkOutTime ?? "12:00",
      shortTimeRate: Math.max(0, Number(body.shortTimeRate ?? 400)),
      shortTimeHours: Math.max(1, Number(body.shortTimeHours ?? 3)),
      defaultKeyDeposit: Math.max(0, Number(body.defaultKeyDeposit ?? 200)),
      enableShortTime: body.enableShortTime !== undefined ? Boolean(body.enableShortTime) : true,
      enableMonthly: body.enableMonthly !== undefined ? Boolean(body.enableMonthly) : true,
    },
    create: {
      id: 1,
      hotelName: body.hotelName || "TheRoom Resort ชุมแพ",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "UPDATE_SETTINGS",
      entityType: "PropertySetting",
      entityId: "1",
      details: JSON.stringify(body),
    },
  });

  invalidateHotelNameCache();
  revalidatePath("/", "layout");
  return NextResponse.json({ setting: updated });
}
