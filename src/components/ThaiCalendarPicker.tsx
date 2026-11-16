"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const DAY_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// Fixed annual Thai public holidays (MM-DD)
const FIXED_THAI_HOLIDAYS: Record<string, string> = {
  "01-01": "วันขึ้นปีใหม่",
  "04-06": "วันจักรี",
  "04-13": "วันสงกรานต์",
  "04-14": "วันสงกรานต์",
  "04-15": "วันสงกรานต์",
  "05-01": "วันแรงงานแห่งชาติ",
  "05-04": "วันฉัตรมงคล",
  "06-03": "วันเฉลิมฯ พระราชินี",
  "07-28": "วันเฉลิมฯ ร.10",
  "08-12": "วันแม่แห่งชาติ",
  "10-13": "วันนวมินทรมหาราช",
  "10-23": "วันปิยมหาราช",
  "12-05": "วันพ่อแห่งชาติ",
  "12-10": "วันรัฐธรรมนูญ",
  "12-31": "วันสิ้นปี",
};

// Lunar & substitution Thai holidays (YYYY-MM-DD) for 2025-2027
const SPECIFIC_THAI_HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-02-12": "วันมาฆบูชา",
  "2025-04-07": "ชดเชยวันจักรี",
  "2025-05-05": "ชดเชยวันฉัตรมงคล",
  "2025-05-11": "วันวิสาขบูชา",
  "2025-05-12": "ชดเชยวันวิสาขบูชา",
  "2025-07-10": "วันอาสาฬหบูชา",
  "2025-07-11": "วันเข้าพรรษา",
  "2025-10-06": "ชดเชยวันรัฐธรรมนูญ",
  // 2026
  "2026-03-03": "วันมาฆบูชา",
  "2026-05-31": "วันวิสาขบูชา",
  "2026-06-01": "ชดเชยวันวิสาขบูชา",
  "2026-07-29": "วันอาสาฬหบูชา",
  "2026-07-30": "วันเข้าพรรษา",
  "2026-12-07": "ชดเชยวันพ่อแห่งชาติ",
  // 2027
  "2027-02-21": "วันมาฆบูชา",
  "2027-02-22": "ชดเชยวันมาฆบูชา",
  "2027-05-03": "ชดเชยวันแรงงานฯ",
  "2027-05-20": "วันวิสาขบูชา",
  "2027-07-18": "วันอาสาฬหบูชา",
  "2027-07-19": "ชดเชยวันอาสาฬหบูชา",
  "2027-10-25": "ชดเชยวันปิยมหาราช",
  "2027-12-06": "ชดเชยวันพ่อแห่งชาติ",
};

function getThaiHoliday(dateKey: string): string | null {
  if (SPECIFIC_THAI_HOLIDAYS[dateKey]) return SPECIFIC_THAI_HOLIDAYS[dateKey];
  const mmdd = dateKey.slice(5);
  return FIXED_THAI_HOLIDAYS[mmdd] ?? null;
}

function toDateKey(year: number, month0: number, day: number): string {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatThaiDisplay(dateKey: string): string {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`;
}

export function ThaiCalendarPicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  className = "",
  compact = false,
  align = "left",
}: {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      return { year: y, month0: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth() };
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth0, setViewMonth0] = useState(initialDate.month0);

  useEffect(() => {
    if (open) {
      setViewYear(initialDate.year);
      setViewMonth0(initialDate.month0);
    }
  }, [open, initialDate.year, initialDate.month0]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const todayKey = useMemo(() => {
    const n = new Date();
    return toDateKey(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const daysGrid = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth0, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth0 + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string; holiday: string | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, key: `empty-${i}`, holiday: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(viewYear, viewMonth0, d);
      cells.push({ day: d, key, holiday: getThaiHoliday(key) });
    }
    return cells;
  }, [viewYear, viewMonth0]);

  const monthHolidays = useMemo(() => {
    return daysGrid
      .filter((c) => c.day !== null && c.holiday !== null)
      .map((c) => ({ day: c.day as number, name: c.holiday as string }));
  }, [daysGrid]);

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth0 + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  }

  const selectedHoliday = value ? getThaiHoliday(value) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 text-left transition ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className={value ? "font-medium text-slate-900" : "text-slate-400"}>
            {value ? formatThaiDisplay(value) : placeholder}
          </span>
          {selectedHoliday && (
            <span
              className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
              title={selectedHoliday}
            />
          )}
        </span>
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 space-y-3 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Month Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-slate-900">
              {THAI_MONTHS[viewMonth0]} {viewYear + 543}
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold">
            {DAY_HEADERS.map((d, idx) => (
              <div
                key={d}
                className={`py-1 ${
                  idx === 0
                    ? "text-rose-500"
                    : idx === 6
                      ? "text-amber-600"
                      : "text-slate-400"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {daysGrid.map((cell, idx) => {
              if (!cell.day) return <div key={cell.key} />;
              const isSelected = value === cell.key;
              const isToday = todayKey === cell.key;
              const dow = idx % 7;
              const isSunday = dow === 0;
              const isSaturday = dow === 6;

              return (
                <button
                  key={cell.key}
                  type="button"
                  title={cell.holiday || undefined}
                  onClick={() => {
                    onChange(cell.key);
                    setOpen(false);
                  }}
                  className={`relative h-9 rounded-xl text-xs flex flex-col items-center justify-center transition ${
                    isSelected
                      ? "bg-[#2D160B] text-[#F6DC93] font-bold shadow-xs"
                      : isToday
                        ? "bg-amber-50 text-slate-900 font-bold ring-1 ring-amber-400"
                        : cell.holiday
                          ? "text-rose-600 font-semibold hover:bg-rose-50"
                          : isSunday
                            ? "text-rose-500 hover:bg-slate-100"
                            : isSaturday
                              ? "text-amber-700 hover:bg-slate-100"
                              : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{cell.day}</span>
                  {cell.holiday && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSelected ? "bg-[#F6DC93]" : "bg-rose-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Holidays in current month */}
          {monthHolidays.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1 max-h-24 overflow-y-auto">
              <div className="text-[10px] font-semibold text-slate-400">วันหยุดเดือนนี้</div>
              <div className="flex flex-wrap gap-1">
                {monthHolidays.map((h) => (
                  <span
                    key={`${h.day}-${h.name}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-medium"
                  >
                    <span className="font-bold">{h.day}</span> {h.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayKey);
                setOpen(false);
              }}
              className="font-semibold text-[#9E731A] hover:bg-amber-50 px-2.5 py-1 rounded-lg transition"
            >
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
