import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const checkDb = url.searchParams.get("db") === "1";

  let dbStatus = "skipped";
  if (checkDb) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (err: unknown) {
      dbStatus = err instanceof Error ? err.message : "db_error";
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
