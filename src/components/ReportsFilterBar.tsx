"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History, Printer } from "lucide-react";
import { ThaiCalendarPicker } from "@/components/ThaiCalendarPicker";
import { getBangkokDateKey } from "@/components/HistoryDateFilter";

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
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
    const todayStr = getBangkokDateKey();
    if (preset === "ALL") {
      applyRange("", "");
    } else if (preset === "TODAY") {
      applyRange(todayStr, todayStr);
    } else if (preset === "7D") {
      applyRange(shiftDateKey(todayStr, -6), todayStr);
    } else if (preset === "MONTH") {
      applyRange(`${todayStr.slice(0, 7)}-01`, todayStr);
    }
  }

  const todayKey = getBangkokDateKey();
  const last7Key = shiftDateKey(todayKey, -6);
  const monthStartKey = `${todayKey.slice(0, 7)}-01`;
  const singleDateValue = from && from === to ? from : "";

  return (
    <div className="no-print bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
        <div className="flex items-center justify-between sm:justify-start gap-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const base = singleDateValue || from || todayKey;
                const prev = shiftDateKey(base, -1);
                applyRange(prev, prev);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <ThaiCalendarPicker
              value={singleDateValue}
              onChange={(val) => {
                if (val) applyRange(val, val);
                else applyRange("", "");
              }}
              compact
              className="w-36"
            />
            <button
              type="button"
              onClick={() => {
                const base = singleDateValue || to || todayKey;
                const next = shiftDateKey(base, 1);
                applyRange(next, next);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="วันถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              title="พิมพ์รายงาน"
              className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            {onToggleAudit ? (
              <button
                type="button"
                onClick={onToggleAudit}
                title="ประวัติการใช้งาน (Audit Log)"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                  showAudit
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>({auditCount})</span>
              </button>
            ) : (
              <Link
                href={auditHref}
                title="ประวัติการใช้งาน (Audit Log)"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                <History className="w-3.5 h-3.5" />
                <span>({auditCount})</span>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => selectPreset("TODAY")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-center whitespace-nowrap ${
              initialFrom === todayKey && initialTo === todayKey
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => selectPreset("7D")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-center whitespace-nowrap ${
              initialFrom === last7Key && initialTo === todayKey
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            7 วันล่าสุด
          </button>
          <button
            type="button"
            onClick={() => selectPreset("MONTH")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-center whitespace-nowrap ${
              initialFrom === monthStartKey && initialTo === todayKey
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            เดือนนี้
          </button>
          <button
            type="button"
            onClick={() => selectPreset("ALL")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-center whitespace-nowrap ${
              !initialFrom && !initialTo
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => window.print()}
          title="พิมพ์รายงาน"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>พิมพ์</span>
        </button>
        {onToggleAudit ? (
          <button
            type="button"
            onClick={onToggleAudit}
            title="ประวัติการใช้งาน (Audit Log)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              showAudit
                ? "bg-slate-900 border-slate-900 text-white"
                : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Log</span>
            <span>({auditCount})</span>
          </button>
        ) : (
          <Link
            href={auditHref}
            title="ประวัติการใช้งาน (Audit Log)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Log</span>
            <span>({auditCount})</span>
          </Link>
        )}
      </div>
    </div>
  );
}
