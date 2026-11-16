import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.passwordResetRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, username: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username = String(body.username || "").trim();
  const note = String(body.note || "").trim();

  if (!username) {
    return NextResponse.json({ error: "กรุณากรอกชื่อผู้ใช้ (Username)" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target || !target.active) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้งานนี้ในระบบ" }, { status: 404 });
  }

  const existing = await prisma.passwordResetRequest.findFirst({
    where: { userId: target.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.passwordResetRequest.update({
      where: { id: existing.id },
      data: { note: note || existing.note },
    });
    return NextResponse.json({
      ok: true,
      message: "ส่งคำขอรีเซ็ตรหัสผ่านให้ผู้จัดการแล้ว กรุณารอผู้จัดการอนุมัติ",
    });
  }

  const created = await prisma.passwordResetRequest.create({
    data: {
      userId: target.id,
      username: target.username,
      note,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: target.id,
      action: "PASSWORD_RESET_REQUEST",
      entityType: "PasswordResetRequest",
      entityId: created.id,
      details: `${target.name} (${target.username}) ขอลืมรหัสผ่าน${note ? `: ${note}` : ""}`,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "ส่งคำขอรีเซ็ตรหัสผ่านให้ผู้จัดการแล้ว กรุณารอผู้จัดการอนุมัติ",
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id || "").trim();
  const action = String(body.action || "").trim();
  const newPassword = String(body.newPassword || "").trim();

  if (!id || !["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const reqRow = await prisma.passwordResetRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!reqRow || reqRow.status !== "PENDING") {
    return NextResponse.json({ error: "ไม่พบคำขอที่รออนุมัติ" }, { status: 404 });
  }

  if (action === "APPROVE") {
    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร" },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: reqRow.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_APPROVED",
          entityType: "User",
          entityId: reqRow.userId,
          details: `ผู้จัดการอนุมัติรีเซ็ตรหัสผ่านให้ ${reqRow.user.name} (${reqRow.username})`,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  await prisma.$transaction([
    prisma.passwordResetRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REJECTED",
        entityType: "User",
        entityId: reqRow.userId,
        details: `ผู้จัดการปฏิเสธคำขอรีเซ็ตรหัสผ่านของ ${reqRow.user.name} (${reqRow.username})`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "REJECTED" });
}
