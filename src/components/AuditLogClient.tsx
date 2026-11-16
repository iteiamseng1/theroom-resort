"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, History, Search, X } from "lucide-react";

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  userName: string;
  createdAt: string;
};

function getDisplayDocNo(entityId: string, details: string): string {
  const isCuid = /^c[a-z0-9]{20,}$/i.test(entityId);
  if (isCuid || !entityId) {
    const match = details.match(/\b([A-Z]{2,4}-?\d{6}-\d{3,}|[A-Z]{2,4}-\d{4,}-\d+|[A-Z]{2,4}-\d+)\b/);
    if (match) return match[1];
  }
  return entityId;
}

function formatAuditDetails(action: string, details: string): string {
  const trimmed = details.trim();
  if (!trimmed.startsWith("{")) return details;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (action === "STOCK_RECEIVE" && Array.isArray(parsed.lines)) {
      const lines = parsed.lines as Array<{ name?: string; quantity?: number; unit?: string }>;
      const itemsText = lines
        .map((l) => `${l.name || "สินค้า"} ×${l.quantity ?? 0}${l.unit ? ` ${l.unit}` : ""}`)
        .join(", ");
      const supplierText = parsed.supplier ? ` (${String(parsed.supplier)})` : "";
      const totalCost = Number(parsed.totalCost ?? 0).toLocaleString("th-TH");
      const notesText = parsed.notes ? ` · หมายเหตุ: ${String(parsed.notes)}` : "";
      return `รับเข้าคลัง${supplierText}: ${itemsText} · ยอดทุนรวม ฿${totalCost}${notesText}`;
    }

    if (action === "UPDATE_SETTINGS") {
      const parts: string[] = [];
      if (parsed.hotelName) parts.push(`ชื่อโรงแรม: ${String(parsed.hotelName)}`);
      if (parsed.vatRate !== undefined) parts.push(`VAT ${String(parsed.vatRate)}%`);
      if (parsed.phone && parsed.phone !== "-") parts.push(`โทร ${String(parsed.phone)}`);
      if (parsed.taxId && parsed.taxId !== "-") parts.push(`เลขผู้เสียภาษี ${String(parsed.taxId)}`);
      if (parts.length > 0) return `อัปเดตการตั้งค่า (${parts.join(" · ")})`;
    }

    return Object.entries(parsed)
      .filter(([, v]) => v !== "" && v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ");
  } catch {
    return details;
  }
}

export function AuditLogClient({
  initialLogs,
  initialFrom = "",
  initialTo = "",
  embedded = false,
  onBackToReport,
}: {
  initialLogs: AuditLogEntry[];
  initialFrom?: string;
  initialTo?: string;
  embedded?: boolean;
  onBackToReport?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchedLogs, setSearchedLogs] = useState<AuditLogEntry[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchedLogs(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/audit-logs?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSearchedLogs(data.logs ?? []);
        }
      } catch {
        // ignore abort
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const displayedLogs = query.trim() ? (searchedLogs ?? []) : initialLogs;
  const backHref =
    initialFrom || initialTo
      ? `/reports?${new URLSearchParams({
          ...(initialFrom ? { from: initialFrom } : {}),
          ...(initialTo ? { to: initialTo } : {}),
        }).toString()}`
      : "/reports";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {embedded && onBackToReport ? (
            <button
              type="button"
              onClick={onBackToReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับสรุปรายงาน
            </button>
          ) : (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายงาน
            </Link>
          )}
          <div>
            <h2 className={`${embedded ? "text-base" : "text-xl"} font-bold text-slate-900 flex items-center gap-2`}>
              <History className="w-5 h-5 text-slate-600" />
              <span>ประวัติการใช้งานและแก้ไขเอกสาร (Audit Log)</span>
            </h2>
            <p className="text-xs text-slate-500">
              {query.trim()
                ? `ผลการค้นหา "${query.trim()}" (${displayedLogs.length} รายการ)`
                : initialFrom || initialTo
                  ? `ช่วงวันที่ ${initialFrom || "..."} ถึง ${initialTo || "..."} (${initialLogs.length} รายการ)`
                  : `รายการล่าสุดทั้งหมด (${initialLogs.length} รายการ)`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์เลขที่บิล / เลขที่เอกสาร / ผู้ทำรายการ เพื่อดูประวัติ (เช่น ISS691113-003, POS691113-001, BKG691113-001)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {searching ? (
          <div className="p-10 text-center text-sm text-slate-400">กำลังค้นหา...</div>
        ) : displayedLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            {query.trim()
              ? `ไม่พบประวัติของ "${query.trim()}"`
              : "ยังไม่มีประวัติในช่วงที่เลือก"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">วัน-เวลา</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">เลขที่บิล / เอกสาร</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">การทำรายการ</th>
                  <th className="px-4 py-3 font-semibold">รายละเอียด</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLogs.map((log) => {
                  const docNo = getDisplayDocNo(log.entityId, log.details);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {docNo ? (
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono font-semibold">
                            {docNo}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatAuditDetails(log.action, log.details)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {log.userName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
