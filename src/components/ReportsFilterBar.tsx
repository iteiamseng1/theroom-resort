"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { History, Printer } from "lucide-react";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReportsFilterBar({
  initialFrom,
  initialTo,
  auditCount = 0,
  showAudit = false,
  onToggleAudit,
}: {
  initialFrom: string;
  initialTo: string;
  auditCount?: number;
  showAudit?: boolean;
  onToggleAudit?: () => void;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  useEffect(() => {
    setFrom(initialFrom);
    setTo(initialTo);
  }, [initialFrom, initialTo]);

  const auditHref =
    from || to
      ? `/reports/audit-log?${new URLSearchParams({
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        }).toString()}`
      : "/reports/audit-log";

  function applyRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    if (!nextFrom && !nextTo) {
      router.push("/reports?all=1");
      return;
    }
    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    router.push(`/reports?${params.toString()}`);
  }

  function selectPreset(preset: "TODAY" | "7D" | "MONTH" | "ALL") {
    const now = new Date();
    const todayStr = formatLocalDate(now);
    if (preset === "ALL") {
      applyRange("", "");
    } else if (preset === "TODAY") {
      applyRange(todayStr, todayStr);
    } else if (preset === "7D") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      applyRange(formatLocalDate(start), todayStr);
    } else if (preset === "MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      applyRange(formatLocalDate(start), todayStr);
    }
  }

  return (
    <div className="no-print bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => selectPreset("TODAY")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            initialFrom === formatLocalDate(new Date()) &&
            initialTo === formatLocalDate(new Date())
              ? "bg-slate-900 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          วันนี้
        </button>
        <button
          type="button"
          onClick={() => selectPreset("7D")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          7 วันล่าสุด
        </button>
        <button
          type="button"
          onClick={() => selectPreset("MONTH")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          เดือนนี้
        </button>
        <button
          type="button"
          onClick={() => selectPreset("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            !initialFrom && !initialTo
              ? "bg-slate-900 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          ทั้งหมด
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          title="พิมพ์รายงาน"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">พิมพ์</span>
        </button>
        {onToggleAudit ? (
          <button
            type="button"
            onClick={onToggleAudit}
            title="ประวัติการใช้งาน (Audit Log)"
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              showAudit
                ? "bg-slate-900 border-slate-900 text-white"
                : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit Log</span>
            <span>({auditCount})</span>
          </button>
        ) : (
          <Link
            href={auditHref}
            title="ประวัติการใช้งาน (Audit Log)"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit Log</span>
            <span>({auditCount})</span>
          </Link>
        )}
      </div>
    </div>
  );
}
