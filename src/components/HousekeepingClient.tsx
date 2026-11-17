"use client";

import { useMemo, useState } from "react";
import { ThaiCalendarPicker } from "@/components/ThaiCalendarPicker";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Play,
  Wrench,
} from "lucide-react";

function toBangkokDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

interface TaskRow {
  id: string;
  taskCode?: string;
  type: string;
  priority: string;
  status: string;
  notes: string;
  createdAt: string;
  room: { id: string; roomNumber: string; floor: number; status: string };
}

interface RoomOption {
  id: string;
  roomNumber: string;
  status: string;
}

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
};

export function HousekeepingClient({
  initialTasks,
  initialDate,
}: {
  initialTasks: TaskRow[];
  rooms: RoomOption[];
  initialDate: string;
}) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  const filteredTasks = useMemo(() => {
    const list = selectedDate
      ? tasks.filter((t) => toBangkokDateKey(t.createdAt) === selectedDate)
      : [...tasks];
    return list.sort((a, b) => {
      const rankDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, selectedDate]);

  async function refresh() {
    const res = await fetch("/api/housekeeping");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }

  async function updateStatus(taskId: string, status: "IN_PROGRESS" | "COMPLETED") {
    const res = await fetch("/api/housekeeping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    if (res.ok) {
      await refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">แม่บ้าน &amp; ซ่อมบำรุง</h1>
          <p className="hidden sm:block text-sm text-slate-500">
            อัปเดตสถานะทำความสะอาดจากมือถือได้ทันที
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDate((prev) => shiftDateKey(prev || initialDate, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="วันก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <ThaiCalendarPicker
            value={selectedDate}
            onChange={(val) => setSelectedDate(val)}
            compact
            className="w-36"
          />
          <button
            type="button"
            onClick={() => setSelectedDate((prev) => shiftDateKey(prev || initialDate, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="วันถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(initialDate)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              selectedDate === initialDate
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate("")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              selectedDate === ""
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            ทั้งหมด
          </button>
          <span className="px-2 text-xs font-semibold text-slate-500">
            ({filteredTasks.length} งาน)
          </span>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          ไม่มีรายการงานแม่บ้านหรือแจ้งซ่อมในวันที่เลือก
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    task.type === "MAINTENANCE"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-sky-100 text-sky-600"
                  }`}
                >
                  {task.type === "MAINTENANCE" ? (
                    <Wrench className="w-4 h-4" />
                  ) : (
                    <ClipboardCheck className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      ห้อง {task.room.roomNumber} •{" "}
                      {task.type === "MAINTENANCE" ? "แจ้งซ่อม" : "ทำความสะอาด"}
                    </span>
                    {task.taskCode && (
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.taskCode}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {task.notes || "ไม่มีหมายเหตุ"} · {new Date(task.createdAt).toLocaleString("th-TH")}
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  task.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-700"
                    : task.status === "IN_PROGRESS"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {task.status === "COMPLETED"
                  ? "เสร็จสิ้น"
                  : task.status === "IN_PROGRESS"
                    ? "กำลังดำเนินการ"
                    : "รอดำเนินการ"}
              </span>
            </div>

            {task.status !== "COMPLETED" && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {task.status === "PENDING" && (
                  <button
                    onClick={() => updateStatus(task.id, "IN_PROGRESS")}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5" /> เริ่มทำ
                  </button>
                )}
                <button
                  onClick={() => updateStatus(task.id, "COMPLETED")}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> เสร็จสิ้น (ว่างพร้อมพัก)
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
