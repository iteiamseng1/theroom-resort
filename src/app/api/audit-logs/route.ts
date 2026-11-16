import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "MANAGER", "ACCOUNTING"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        userName: log.user?.name || "System",
        createdAt: log.createdAt.toISOString(),
      })),
    });
  }

  const variants = new Set<string>([q]);
  const docMatch = q.match(/^([A-Za-z]{3})-?(\d{6}-\d{3,})$/);
  if (docMatch) {
    const prefix = docMatch[1].toUpperCase();
    const rest = docMatch[2];
    variants.add(`${prefix}${rest}`);
    variants.add(`${prefix}-${rest}`);
  }

  const orClauses = Array.from(variants).flatMap((term) => [
    { entityId: { contains: term } },
    { details: { contains: term } },
    { action: { contains: term } },
    { entityType: { contains: term } },
    { user: { name: { contains: term } } },
  ]);

  const logs = await prisma.auditLog.findMany({
    where: { OR: orClauses },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      userName: log.user?.name || "System",
      createdAt: log.createdAt.toISOString(),
    })),
  });
}
