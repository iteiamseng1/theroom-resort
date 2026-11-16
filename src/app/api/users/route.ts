import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      allowedMenus: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const username = String(body.username || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  const role = String(body.role || "FRONT_DESK");

  if (!username || !name || password.length < 4) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบ และรหัสผ่านอย่างน้อย 4 ตัวอักษร" },
      { status: 400 }
    );
  }

  if (role === "OWNER" && user.role !== "OWNER") {
    return NextResponse.json(
      { error: "เฉพาะเจ้าของกิจการเท่านั้นที่สร้างสิทธิ์ OWNER ได้" },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username นี้มีผู้ใช้งานแล้ว" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const allowedMenus = Array.isArray(body.allowedMenus)
    ? JSON.stringify(body.allowedMenus)
    : "";
  const created = await prisma.user.create({
    data: { username, name, passwordHash, role, allowedMenus, active: true },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      allowedMenus: true,
      active: true,
      createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: created.id,
      details: `${created.username} (${created.role})`,
    },
  });

  return NextResponse.json({ user: created });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const target = await prisma.user.findUnique({ where: { id: body.id } });
  if (!target) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
  }

  if (target.role === "OWNER" && user.role !== "OWNER") {
    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขบัญชีเจ้าของกิจการ (OWNER) ได้" },
      { status: 403 }
    );
  }

  if (target.id === user.id && body.active === false) {
    return NextResponse.json(
      { error: "ไม่สามารถปิดใช้งานบัญชีตัวเองได้" },
      { status: 400 }
    );
  }

  const data: {
    name?: string;
    role?: string;
    allowedMenus?: string;
    active?: boolean;
    passwordHash?: string;
  } = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.allowedMenus !== undefined) {
    data.allowedMenus = Array.isArray(body.allowedMenus)
      ? JSON.stringify(body.allowedMenus)
      : String(body.allowedMenus || "");
  }
  if (body.role !== undefined) {
    if (body.role === "OWNER" && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "เฉพาะเจ้าของกิจการเท่านั้นที่มอบสิทธิ์ OWNER ได้" },
        { status: 403 }
      );
    }
    data.role = body.role;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.password !== undefined) {
    const newPassword = String(body.password);
    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" },
        { status: 400 }
      );
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: body.id },
    data,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      allowedMenus: true,
      active: true,
      createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: updated.id,
      details: `${updated.username} -> role=${updated.role}, active=${updated.active}`,
    },
  });

  return NextResponse.json({ user: updated });
}
