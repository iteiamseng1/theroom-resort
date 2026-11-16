import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const guests = await prisma.guest.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { phone: { contains: q } },
            { idNumber: { contains: q } },
          ],
        }
      : undefined,
    include: {
      stays: {
        include: {
          room: true,
          folio: {
            select: {
              id: true,
              status: true,
              balance: true,
              totalCharges: true,
              totalPayments: true,
            },
          },
        },
        orderBy: { checkInDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ guests });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const guest = await prisma.guest.create({
    data: {
      fullName: body.fullName,
      phone: body.phone || "",
      email: body.email || "",
      idType: body.idType || "THAI_ID",
      idNumber: body.idNumber || "",
      nationality: body.nationality || "Thai",
      address: body.address || "",
      vehiclePlate: body.vehiclePlate || "",
      preferences: body.preferences || "",
      tag: body.tag || "NORMAL",
    },
  });

  return NextResponse.json({ guest });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing guest id" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (body.fullName !== undefined) {
    const trimmed = String(body.fullName).trim();
    if (!trimmed) {
      return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
    }
    data.fullName = trimmed;
  }
  if (body.phone !== undefined) data.phone = String(body.phone).trim();
  if (body.email !== undefined) data.email = String(body.email).trim();
  if (body.address !== undefined) data.address = String(body.address).trim();
  if (body.idNumber !== undefined) data.idNumber = String(body.idNumber).trim();
  if (body.vehiclePlate !== undefined) data.vehiclePlate = String(body.vehiclePlate).trim();
  if (body.preferences !== undefined) data.preferences = String(body.preferences).trim();
  if (body.tag !== undefined) data.tag = String(body.tag);

  const guest = await prisma.guest.update({
    where: { id: body.id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "GUEST_UPDATE",
      entityType: "Guest",
      entityId: guest.id,
      details: `แก้ไขข้อมูลลูกค้า ${guest.fullName} (${guest.phone || "-"})`,
    },
  });

  return NextResponse.json({ guest });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Missing guest id" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) {
    return NextResponse.json({ error: "ไม่พบข้อมูลลูกค้า" }, { status: 404 });
  }

  const stayCount = await prisma.stay.count({ where: { guestId: id } });
  if (stayCount > 0) {
    return NextResponse.json(
      { error: `ไม่สามารถลบลูกค้าที่มีประวัติการเข้าพักอยู่ได้ (${stayCount} รายการ)` },
      { status: 400 }
    );
  }

  await prisma.guest.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "GUEST_DELETE",
      entityType: "Guest",
      entityId: id,
      details: `ลบข้อมูลลูกค้า ${guest.fullName} (${guest.phone || "-"})`,
    },
  });

  return NextResponse.json({ ok: true });
}
