"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThaiCalendarPicker } from "@/components/ThaiCalendarPicker";

const bangkokDateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });

export function getBangkokDateKey(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return bangkokDateFmt.format(d);
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function filterByThaiDate<T>(
  items: T[],
  getDate: (item: T) => string,
  selectedDate: string
): T[] {
  if (!selectedDate) return items;
  return items.filter((item) => getBangkokDateKey(getDate(item)) === selectedDate);
}

export function HistoryDateFilter({
  selectedDate,
  onChange,
  count,
  unitLabel = "รายการ",
}: {
  selectedDate: string;
  onChange: (nextDate: string) => void;
  count: number;
  unitLabel?: string;
}) {
  const todayKey = getBangkokDateKey();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs inline-flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(shiftDateKey(selectedDate || todayKey, -1))}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
        title="วันก่อนหน้า"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <ThaiCalendarPicker
        value={selectedDate}
        onChange={(val) => onChange(val)}
        compact
        className="w-36"
      />
      <button
        type="button"
        onClick={() => onChange(shiftDateKey(selectedDate || todayKey, 1))}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
        title="วันถัดไป"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(todayKey)}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
          selectedDate === todayKey
            ? "bg-slate-900 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        }`}
      >
        วันนี้
      </button>
      <button
        type="button"
        onClick={() => onChange("")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
          selectedDate === ""
            ? "bg-slate-900 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        }`}
      >
        ทั้งหมด
      </button>
      <span className="px-2 text-xs font-semibold text-slate-500">
        ({count} {unitLabel})
      </span>
    </div>
  );
}
