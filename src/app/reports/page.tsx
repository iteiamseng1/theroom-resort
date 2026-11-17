import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ReportsDashboardShell } from "@/components/ReportsDashboardShell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

function getLocalTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; all?: string }>;
}) {
  const { user, hotelName } = await requireSession(["OWNER", "MANAGER", "ACCOUNTING"], "/reports");
  const params = await searchParams;
  const todayKey = getLocalTodayKey();
  const isAll = params.all === "1";
  const from = isAll ? "" : (params.from ?? todayKey);
  const to = isAll ? "" : (params.to ?? todayKey);

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59.999`);
  const hasDateFilter = Boolean(from || to);

  // Execute sequentially on a single warm connection to avoid Neon connection pool storms
  const rooms = await prisma.room.findMany({ include: { roomType: true } });
  const staysInRange = await prisma.stay.findMany({
    where: hasDateFilter
      ? {
          status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
          OR: [
            { actualCheckIn: dateFilter },
            { checkInDate: dateFilter },
          ],
        }
      : { status: "CHECKED_IN" },
    select: {
      id: true,
      stayType: true,
      status: true,
      room: { select: { roomNumber: true, roomType: { select: { code: true } } } },
      folio: {
        select: {
          payments: {
            select: { source: true, method: true, amount: true },
          },
        },
      },
    },
  });
  const payments = await prisma.payment.findMany({
    where: hasDateFilter ? { paidAt: dateFilter } : undefined,
  });
  const posOrders = await prisma.posOrder.findMany({
    where: {
      status: { not: "CANCELLED" },
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
    },
  });
  const auditLogs = await prisma.auditLog.findMany({
    where: hasDateFilter ? { createdAt: dateFilter } : undefined,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const keyDepositStays = await prisma.stay.findMany({
    where: { keyDeposit: { gt: 0 } },
    select: {
      keyDeposit: true,
      keyDepositMethod: true,
      keyDepositStatus: true,
      keyDepositRefunded: true,
      keyDepositRefundMethod: true,
      keyDepositRefundedAt: true,
      actualCheckIn: true,
      createdAt: true,
      folio: {
        select: {
          balance: true,
          payments: {
            select: { source: true, method: true, amount: true },
          },
        },
      },
    },
  });
  const openFolios = await prisma.folio.findMany({
    where: { status: "OPEN", balance: { gt: 0 } },
    select: {
      id: true,
      balance: true,
      stay: {
        select: {
          bookingCode: true,
          room: { select: { roomNumber: true } },
          guest: { select: { fullName: true, phone: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  const supplyIssuesInRange = await prisma.supplyMovement.findMany({
    where: {
      type: "ISSUE",
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    },
    include: { supplyItem: { select: { name: true, unit: true } } },
  });
  const lowStockMenus = await prisma.menuItem.findMany({
    where: { active: true, trackStock: true, stockQty: { lte: 5 } },
    select: { id: true, name: true, stockQty: true },
    orderBy: { stockQty: "asc" },
    take: 6,
  });
  const lowStockSupplies = await prisma.supplyItem.findMany({
    where: { active: true, stockQty: { lte: 10 } },
    select: { id: true, name: true, stockQty: true, minStock: true, unit: true },
    orderBy: { stockQty: "asc" },
    take: 10,
  });
  const pendingResetCount = await prisma.passwordResetRequest.count({ where: { status: "PENDING" } });

  const totalOutstandingBalance = openFolios.reduce((s, f) => s + f.balance, 0);
  const unpaidFolioCount = openFolios.length;

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "OC" || r.status === "OD").length;
  const vacantCleanRooms = rooms.filter((r) => r.status === "VC").length;
  const dirtyRooms = rooms.filter((r) => r.status === "VD" || r.status === "OD").length;
  const oooRooms = rooms.filter((r) => r.status === "OOO" || r.status === "OOS").length;

  const stayCount = hasDateFilter ? staysInRange.length : occupiedRooms;
  const cashStayCount = staysInRange.filter((s) =>
    s.folio?.payments.some(
      (p) => p.amount > 0 && p.source === "FRONT_DESK" && p.method !== "CREDIT_CARD"
    )
  ).length;
  const creditStayCount = staysInRange.length - cashStayCount;
  const dailyStayCount = staysInRange.filter((s) => s.stayType === "DAILY").length;
  const shortTimeStayCount = staysInRange.filter((s) => s.stayType === "SHORT_TIME").length;
  const monthlyStayCount = staysInRange.filter((s) => s.stayType === "MONTHLY").length;
  const stdStayCount = staysInRange.filter((s) => s.room.roomType.code !== "VIP").length;
  const vipStayCount = staysInRange.filter((s) => s.room.roomType.code === "VIP").length;

  const posItemSummary = Array.from(
    posOrders
      .flatMap((o) => o.items)
      .reduce<Map<string, { name: string; qty: number; total: number }>>((map, it) => {
        const cur = map.get(it.menuItem.name) ?? { name: it.menuItem.name, qty: 0, total: 0 };
        cur.qty += it.quantity;
        cur.total += it.quantity * it.unitPrice;
        map.set(it.menuItem.name, cur);
        return map;
      }, new Map())
      .values()
  ).sort((a, b) => b.qty - a.qty);

  const supplyIssueSummary = Array.from(
    supplyIssuesInRange
      .reduce<Map<string, { name: string; unit: string; qty: number }>>((map, m) => {
        const cur = map.get(m.supplyItem.name) ?? {
          name: m.supplyItem.name,
          unit: m.supplyItem.unit,
          qty: 0,
        };
        cur.qty += m.quantity;
        map.set(m.supplyItem.name, cur);
        return map;
      }, new Map())
      .values()
  ).sort((a, b) => b.qty - a.qty);

  const lowSupplies = lowStockSupplies.filter((s) => s.stockQty <= s.minStock);

  const isCash = (m: string) => m === "CASH";
  const isTransfer = (m: string) => m === "TRANSFER" || m === "PROMPTPAY";
  const isCard = (m: string) => m === "CREDIT_CARD";

  const posPayments = payments.filter((p) => Boolean(p.posOrderId));
  const folioPagePayments = payments.filter((p) => !p.posOrderId && p.source === "FOLIO");
  const roomPayments = payments.filter((p) => !p.posOrderId && p.source !== "FOLIO");

  const posCash = posPayments.filter((p) => isCash(p.method)).reduce((s, p) => s + p.amount, 0);
  const posTransfer = posPayments.filter((p) => isTransfer(p.method)).reduce((s, p) => s + p.amount, 0);
  const posCard = posPayments.filter((p) => isCard(p.method)).reduce((s, p) => s + p.amount, 0);
  const posPaidTotal = posPayments.reduce((s, p) => s + p.amount, 0);

  const roomCash = roomPayments.filter((p) => isCash(p.method)).reduce((s, p) => s + p.amount, 0);
  const roomTransfer = roomPayments.filter((p) => isTransfer(p.method)).reduce((s, p) => s + p.amount, 0);
  const roomCard = roomPayments.filter((p) => isCard(p.method)).reduce((s, p) => s + p.amount, 0);
  const roomPaidTotal = roomPayments.reduce((s, p) => s + p.amount, 0);

  const folioCash = folioPagePayments.filter((p) => isCash(p.method)).reduce((s, p) => s + p.amount, 0);
  const folioTransfer = folioPagePayments.filter((p) => isTransfer(p.method)).reduce((s, p) => s + p.amount, 0);
  const folioCard = folioPagePayments.filter((p) => isCard(p.method)).reduce((s, p) => s + p.amount, 0);
  const folioPaidTotal = folioPagePayments.reduce((s, p) => s + p.amount, 0);

  const grandCash = posCash + roomCash + folioCash;
  const grandTransfer = posTransfer + roomTransfer + folioTransfer;
  const drawerCash = roomCash + posCash;
  const drawerTransfer = roomTransfer + posTransfer;
  const drawerTotal = roomPaidTotal + posPaidTotal;

  const inDateRange = (d: Date | null | undefined) => {
    if (!hasDateFilter) return true;
    if (!d) return false;
    if (dateFilter.gte && d < dateFilter.gte) return false;
    if (dateFilter.lte && d > dateFilter.lte) return false;
    return true;
  };
  const isKeyCredit = (s: (typeof keyDepositStays)[number]) =>
    !s.folio?.payments.some(
      (p) => p.amount > 0 && p.source === "FRONT_DESK" && p.method !== "CREDIT_CARD"
    );

  const keyCollectedInRange = keyDepositStays.filter((s) =>
    inDateRange(s.actualCheckIn ?? s.createdAt)
  );
  const keyRefundedInRange = keyDepositStays.filter(
    (s) => s.keyDepositRefunded > 0 && inDateRange(s.keyDepositRefundedAt)
  );
  const keyCashCollected = keyCollectedInRange
    .filter((s) => !isKeyCredit(s))
    .reduce((sum, s) => sum + s.keyDeposit, 0);
  const keyCashRefunded = keyRefundedInRange
    .filter((s) => !isKeyCredit(s))
    .reduce((sum, s) => sum + s.keyDepositRefunded, 0);
  const keyCashHeld = keyDepositStays
    .filter((s) => s.keyDepositStatus === "HELD" && !isKeyCredit(s))
    .reduce((sum, s) => sum + s.keyDeposit, 0);

  const keyCreditCollected = keyCollectedInRange
    .filter((s) => isKeyCredit(s))
    .reduce((sum, s) => sum + s.keyDeposit, 0);
  const keyCreditRefunded = keyRefundedInRange
    .filter((s) => isKeyCredit(s))
    .reduce((sum, s) => sum + s.keyDepositRefunded, 0);
  const keyCreditHeld = keyDepositStays
    .filter((s) => s.keyDepositStatus === "HELD" && isKeyCredit(s))
    .reduce((sum, s) => sum + s.keyDeposit, 0);

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);

  const serializedAuditLogs = auditLogs.map((log) => ({
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
      <div className="space-y-3 sm:space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-1.5">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">รายงานสรุปยอด</h1>
            {hasDateFilter && (
              <p className="text-xs text-sky-700 font-semibold">
                ช่วงวันที่ {from || "..."} ถึง {to || "..."}
              </p>
            )}
          </div>
        </div>

        {pendingResetCount > 0 && (
          <Link
            href="/settings#password-resets"
            className="no-print block rounded-xl bg-amber-50 border-2 border-amber-300 px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-950 hover:bg-amber-100 transition"
          >
            มีคำขอรีเซ็ตรหัสผ่านจากพนักงานรออนุมัติ ({pendingResetCount} รายการ) — กดเพื่ออนุมัติ →
          </Link>
        )}

        <ReportsDashboardShell
          initialFrom={from}
          initialTo={to}
          auditLogs={serializedAuditLogs}
        >
          <div className="space-y-3.5 sm:space-y-6">

        {/* หัวข้อ 1: ยอดรับเงินสุทธิ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold">
                1
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">ยอดรับเงินสุทธิ</h2>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[11px] sm:text-xs text-slate-500">
                {hasDateFilter
                  ? `${from || "..."} ถึง ${to || "..."}`
                  : "ข้อมูลรวมทั้งหมด"}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                ฿{totalPayments.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 px-3 py-2.5">
              <div className="text-[11px] text-emerald-800 font-semibold truncate">
                เงินสด (ห้อง + POS)
              </div>
              <div className="text-sm sm:text-lg font-extrabold text-emerald-700 mt-0.5">
                ฿{drawerTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-700/80 mt-0.5 truncate">
                สด ฿{drawerCash.toLocaleString("th-TH")} · โอน ฿{drawerTransfer.toLocaleString("th-TH")}
              </div>
            </div>

            <div className="rounded-xl bg-sky-50/60 border border-sky-200 px-3 py-2.5">
              <div className="text-[11px] text-sky-800 font-semibold truncate">
                รับชำระเครดิต
              </div>
              <div className="text-sm sm:text-lg font-extrabold text-sky-700 mt-0.5">
                ฿{folioPaidTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] sm:text-[11px] text-sky-700/80 mt-0.5 truncate">
                สด ฿{folioCash.toLocaleString("th-TH")} · โอน ฿{folioTransfer.toLocaleString("th-TH")}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl bg-rose-50/60 border border-rose-200 px-3 py-2.5 flex sm:block items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-rose-800 font-semibold">ค้างชำระ</div>
                <div className="text-sm sm:text-lg font-extrabold text-rose-600 sm:mt-0.5">
                  ฿{totalOutstandingBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] text-rose-700/80 sm:mt-0.5">
                {unpaidFolioCount} บิล รอชำระ
              </div>
            </div>
          </div>
        </div>

        {/* หัวข้อ 2: สรุปเคลียร์เงินส่งร้าน */}
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-3 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
          <div className="border-b border-slate-100 pb-2.5 sm:pb-3 flex flex-wrap items-baseline justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[11px] font-bold">
                2
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                สรุปยอดขาย
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              {hasDateFilter
                ? `${from || "..."} – ${to || "..."}`
                : "รวมทั้งหมด"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ฝั่งซ้าย: เงินในเกะ */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/25 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs sm:text-sm font-bold text-emerald-900 whitespace-nowrap">
                  เงินสด
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold whitespace-nowrap">
                    {cashStayCount} ห้อง
                  </span>
                  <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                    รวม ฿{drawerTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. ห้องพัก (เงินในเกะ) */}
                <div className="rounded-xl bg-white border border-emerald-200 p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-950">1. ห้องพัก ({cashStayCount} ห้อง)</span>
                    <span className="text-slate-500">พัก {occupiedRooms}/{totalRooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">เงินสด</span>
                    <span className="font-bold text-emerald-700">
                      ฿{roomCash.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">เงินโอน</span>
                    <span className="font-bold text-sky-700">
                      ฿{roomTransfer.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {roomCard > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">บัตรเครดิต</span>
                      <span className="font-bold text-slate-700">
                        ฿{roomCard.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-emerald-100 font-bold text-slate-900">
                    <span>รวมห้องพัก</span>
                    <span>฿{roomPaidTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 2. ขาย POS (เงินในเกะ) */}
                <div className="rounded-xl bg-white border border-amber-200 p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-950">2. ขาย POS</span>
                    <span className="text-amber-700 font-medium">{posOrders.length} บิล</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">เงินสด</span>
                    <span className="font-bold text-emerald-700">
                      ฿{posCash.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">เงินโอน</span>
                    <span className="font-bold text-sky-700">
                      ฿{posTransfer.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {posCard > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">บัตรเครดิต</span>
                      <span className="font-bold text-slate-700">
                        ฿{posCard.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-amber-100 font-bold text-slate-900">
                    <span>รวม POS</span>
                    <span>฿{posPaidTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-emerald-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-emerald-900">มัดจำกุญแจ (เงินสด):</span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-700">
                    รับเข้า{" "}
                    <strong className="text-emerald-700">
                      ฿{keyCashCollected.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                  <span className="text-slate-700">
                    คืน{" "}
                    <strong className="text-rose-700">
                      ฿{keyCashRefunded.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                  <span className="text-slate-700">
                    ถือรอคืน{" "}
                    <strong className="text-amber-800">
                      ฿{keyCashHeld.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* ฝั่งขวา: เครดิต / ชำระนอก */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/25 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs sm:text-sm font-bold text-sky-950 whitespace-nowrap">
                  เครดิต
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold whitespace-nowrap">
                    {creditStayCount} ห้อง
                  </span>
                  <span className="text-xs font-bold text-sky-700 whitespace-nowrap">
                    รับชำระ ฿{folioPaidTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 3. ค้างชำระ */}
                <div className="rounded-xl bg-white border border-rose-200 p-3.5 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-900">3. ค้างชำระ</span>
                      <span className="text-rose-700 font-medium">{unpaidFolioCount} บิล</span>
                    </div>
                    <div className="text-2xl font-bold text-rose-600 mt-1">
                      ฿{totalOutstandingBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="pt-1 border-t border-rose-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600">รอรับชำระ</span>
                    <Link href="/billing" className="font-semibold text-rose-700 hover:underline">
                      รับชำระ →
                    </Link>
                  </div>
                </div>

                {/* 4. รับชำระเครดิต */}
                <div className="rounded-xl bg-white border border-sky-200 p-3.5 space-y-1.5 text-xs">
                  <div className="font-bold text-sky-950 mb-1">4. รับชำระเครดิต</div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">เงินสด</span>
                    <span className="font-bold text-emerald-700">
                      ฿{folioCash.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">เงินโอน</span>
                    <span className="font-bold text-sky-700">
                      ฿{folioTransfer.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {folioCard > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">บัตรเครดิต</span>
                      <span className="font-bold text-slate-700">
                        ฿{folioCard.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-sky-100 font-bold text-slate-900">
                    <span>รวมรับชำระ</span>
                    <span>฿{folioPaidTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-sky-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-sky-900">มัดจำกุญแจ (เครดิต):</span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-700">
                    รับเข้า{" "}
                    <strong className="text-sky-700">
                      ฿{keyCreditCollected.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                  <span className="text-slate-700">
                    คืน{" "}
                    <strong className="text-rose-700">
                      ฿{keyCreditRefunded.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                  <span className="text-slate-700">
                    ถือรอคืน{" "}
                    <strong className="text-amber-800">
                      ฿{keyCreditHeld.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* หัวข้อ 3-6: ข้อมูลงานบริการ & ปฏิบัติการหน้าร้าน */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* หัวข้อ 3: ค้างชำระ */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold">
                  3
                </span>
                <h2 className="font-bold text-rose-950 text-sm">
                  ค้างชำระ ({unpaidFolioCount} บิล)
                </h2>
              </div>
              <Link href="/billing" className="text-xs font-semibold text-rose-700 hover:underline">
                จัดการรับชำระ →
              </Link>
            </div>
            <div className="p-4 flex-1">
              {openFolios.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  ไม่มีบิลค้างชำระในขณะนี้
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {openFolios.map((f) => (
                    <Link
                      key={f.id}
                      href={`/billing?folioId=${f.id}`}
                      className="py-2 flex items-center justify-between gap-2 text-xs hover:bg-rose-50/40 px-2 rounded-lg transition"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900">
                          ห้อง {f.stay.room.roomNumber}
                        </span>{" "}
                        <span className="text-slate-700">• {f.stay.guest.fullName}</span>
                        <div className="text-[11px] text-slate-400">
                          {f.stay.bookingCode}
                          {f.stay.guest.phone && f.stay.guest.phone !== "-"
                            ? ` · โทร ${f.stay.guest.phone}`
                            : ""}
                        </div>
                      </div>
                      <span className="font-bold text-rose-600 shrink-0">
                        ฿{f.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* หัวข้อ 4: ห้องพัก & สถานะ */}
          <div className="bg-white rounded-2xl border border-sky-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[11px] font-bold">
                  4
                </span>
                <h2 className="font-bold text-sky-950 text-sm">
                  ห้องพัก &amp; สถานะห้องพร้อมบริการ
                </h2>
              </div>
              <Link href="/front-desk" className="text-xs font-semibold text-sky-700 hover:underline">
                ดูผังห้อง →
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs flex-1">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <div className="text-slate-500 font-medium">เข้าพักในช่วงที่เลือก</div>
                <div className="text-xl font-bold text-slate-900">{stayCount} ครั้ง</div>
                <div className="text-[11px] text-slate-600">
                  เงินสด {cashStayCount} · เครดิต {creditStayCount}
                </div>
                <div className="text-[11px] text-slate-600">
                  ปกติ {stdStayCount} · VIP {vipStayCount}
                </div>
                <div className="text-[11px] text-slate-500">
                  รายวัน {dailyStayCount} · ชั่วคราว {shortTimeStayCount} · รายเดือน{" "}
                  {monthlyStayCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <div className="text-slate-500 font-medium">สถานะห้องตอนนี้ ({totalRooms} ห้อง)</div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-medium">ว่างพร้อมพัก (VC)</span>
                  <span className="font-bold text-emerald-700">{vacantCleanRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-700 font-medium">มีแขกพักอยู่</span>
                  <span className="font-bold text-sky-700">{occupiedRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">รอทำความสะอาด</span>
                  <span className="font-bold text-amber-700">{dirtyRooms}</span>
                </div>
                {oooRooms > 0 && (
                  <div className="flex justify-between">
                    <span className="text-rose-600 font-medium">ปิดซ่อม</span>
                    <span className="font-bold text-rose-600">{oooRooms}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* หัวข้อ 5: สินค้าขายได้ (POS) */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[11px] font-bold">
                  5
                </span>
                <h2 className="font-bold text-amber-950 text-sm">
                  สินค้าขายได้ (POS)
                </h2>
              </div>
              <Link href="/pos" className="text-xs font-semibold text-amber-700 hover:underline">
                เปิดหน้า POS →
              </Link>
            </div>
            <div className="p-4 flex-1">
              {posItemSummary.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  ยังไม่มีรายการขาย POS ในช่วงที่เลือก
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                  {posItemSummary.map((item, idx) => (
                    <div key={item.name} className="py-2 flex items-center justify-between gap-2">
                      <span className="text-slate-800 truncate">
                        <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-slate-700">{item.qty} ชิ้น</span>
                        <span className="font-bold text-emerald-700 w-16 text-right">
                          ฿{item.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* หัวข้อ 6: เบิกของใช้ & สต๊อกใกล้หมด */}
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[11px] font-bold">
                  6
                </span>
                <h2 className="font-bold text-emerald-950 text-sm">
                  เบิกของใช้ &amp; สต๊อกใกล้หมด
                </h2>
              </div>
              <Link href="/stock" className="text-xs font-semibold text-emerald-700 hover:underline">
                เช็กคลังสินค้า →
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs flex-1">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                <div className="font-semibold text-slate-700">ของใช้ที่เบิกออก</div>
                {supplyIssueSummary.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">ไม่มีรายการเบิกในช่วงนี้</div>
                ) : (
                  <div className="space-y-1.5">
                    {supplyIssueSummary.map((s) => (
                      <div key={s.name} className="flex justify-between gap-2">
                        <span className="text-slate-700 truncate min-w-0">{s.name}</span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {s.qty} {s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-rose-50/50 border border-rose-200 p-3 space-y-1.5">
                <div className="font-semibold text-rose-900">สินค้าใกล้หมดสต๊อก</div>
                {lowStockMenus.length === 0 && lowSupplies.length === 0 ? (
                  <div className="text-[11px] text-emerald-700 py-2">สต๊อกเพียงพอทุกรายการ</div>
                ) : (
                  <div className="space-y-1.5">
                    {lowStockMenus.map((m) => (
                      <div key={m.id} className="flex justify-between gap-2">
                        <span className="text-slate-700 truncate min-w-0">{m.name}</span>
                        <span className="font-bold text-rose-600 shrink-0">เหลือ {m.stockQty}</span>
                      </div>
                    ))}
                    {lowSupplies.map((s) => (
                      <div key={s.id} className="flex justify-between gap-2">
                        <span className="text-slate-700 truncate min-w-0">{s.name}</span>
                        <span className="font-bold text-rose-600 shrink-0">
                          เหลือ {s.stockQty} {s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          </div>
        </ReportsDashboardShell>
      </div>
    </AppShell>
  );
}
