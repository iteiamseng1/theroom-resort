import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = await prisma.room.findMany({
    include: {
      roomType: true,
      stays: {
        where: { status: { in: ["RESERVED", "CHECKED_IN"] } },
        include: { guest: true, folio: true },
        orderBy: { checkInDate: "asc" },
      },
    },
    orderBy: { roomNumber: "asc" },
  });

  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (body.action === "CREATE_ROOM_TYPE") {
    const rt = await prisma.roomType.create({
      data: {
        code: String(body.code).toUpperCase(),
        name: body.name,
        baseDailyRate: Number(body.baseDailyRate),
        baseMonthlyRate: Number(body.baseMonthlyRate),
        maxOccupancy: Number(body.maxOccupancy ?? 2),
        description: body.description ?? "",
      },
    });
    return NextResponse.json({ roomType: rt });
  }

  const room = await prisma.room.create({
    data: {
      roomNumber: String(body.roomNumber),
      floor: Number(body.floor ?? 1),
      zone: body.zone ?? "Building A",
      roomTypeId: body.roomTypeId,
      status: body.status ?? "VC",
    },
    include: { roomType: true },
  });

  return NextResponse.json({ room });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "UPDATE_ROOM_TYPE") {
    if (!["OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const roomType = await prisma.roomType.update({
      where: { id: body.id },
      data: {
        code: String(body.code).toUpperCase(),
        name: body.name,
        baseDailyRate: Number(body.baseDailyRate),
        baseMonthlyRate: Number(body.baseMonthlyRate),
        maxOccupancy: Number(body.maxOccupancy ?? 2),
      },
    });
    return NextResponse.json({ roomType });
  }

  if (body.action === "UPDATE_ROOM") {
    if (!["OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const room = await prisma.room.update({
      where: { id: body.id },
      data: {
        roomNumber: String(body.roomNumber),
        floor: Number(body.floor),
        zone: body.zone,
        roomTypeId: body.roomTypeId,
        status: body.status,
      },
      include: { roomType: true },
    });
    return NextResponse.json({ room });
  }

  const room = await prisma.room.update({
    where: { id: body.id },
    data: {
      status: body.status,
      notes: body.notes ?? undefined,
    },
    include: { roomType: true },
  });

  return NextResponse.json({ room });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    if (body.action === "DELETE_ROOM_TYPE") {
      const count = await prisma.room.count({ where: { roomTypeId: body.id } });
      if (count > 0) {
        return NextResponse.json(
          { error: "ไม่สามารถลบได้ เนื่องจากยังมีห้องพักใช้ประเภทนี้อยู่" },
          { status: 400 }
        );
      }
      await prisma.roomType.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "DELETE_ROOM") {
      const stayCount = await prisma.stay.count({ where: { roomId: body.id } });
      if (stayCount > 0) {
        return NextResponse.json(
          { error: "ไม่สามารถลบห้องที่มีประวัติการเข้าพักแล้วได้ (แนะนำให้ตั้งเป็น OOO แทน)" },
          { status: 400 }
        );
      }
      await prisma.room.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }
  } catch {
    return NextResponse.json({ error: "ลบข้อมูลไม่สำเร็จ" }, { status: 400 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
