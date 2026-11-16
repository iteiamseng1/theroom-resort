import { AppShell } from "@/components/AppShell";
import { AuditLogClient } from "@/components/AuditLogClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, hotelName } = await requireSession(
    ["OWNER", "MANAGER", "ACCOUNTING"],
    "/reports/audit-log"
  );
  const { from = "", to = "" } = await searchParams;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59.999`);
  const hasDateFilter = Boolean(from || to);

  const auditLogs = await prisma.auditLog.findMany({
    where: hasDateFilter ? { createdAt: dateFilter } : undefined,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const initialLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    userName: log.user?.name || "System",
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <AppShell user={user} hotelName={hotelName}>
      <AuditLogClient
        initialLogs={initialLogs}
        initialFrom={from}
        initialTo={to}
      />
    </AppShell>
  );
}
