"use client";

import { useState } from "react";
import { CheckCircle2, Droplets, Zap } from "lucide-react";

interface RoomMeter {
  id: string;
  roomNumber: string;
  floor: number;
  zone: string;
  lastWaterMeter: number;
  lastElectricMeter: number;
  stays: Array<{
    id: string;
    stayType: string;
    guest: { fullName: string };
    folio: { id: string } | null;
  }>;
}

interface ReadingRecord {
  roomId: string;
  prevWater: number;
  currWater: number;
  waterUnits: number;
  waterAmount: number;
  prevElectric: number;
  currElectric: number;
  electricUnits: number;
  electricAmount: number;
  billed: boolean;
}

export function MetersClient({
  initialRooms,
  initialReadings,
  initialMonth,
  waterRate,
  electricRate,
}: {
  initialRooms: RoomMeter[];
  initialReadings: ReadingRecord[];
  initialMonth: string;
  waterRate: number;
  electricRate: number;
}) {
  const [rooms, setRooms] = useState<RoomMeter[]>(initialRooms);
  const [readings, setReadings] = useState<Record<string, ReadingRecord>>(() => {
    const map: Record<string, ReadingRecord> = {};
    for (const r of initialReadings) {
      map[r.roomId] = r;
    }
    return map;
  });
  const [billingMonth, setBillingMonth] = useState(initialMonth);
  const [inputs, setInputs] = useState<Record<string, { water: string; electric: string }>>(() => {
    const map: Record<string, { water: string; electric: string }> = {};
    for (const r of initialRooms) {
      map[r.id] = {
        water: String(r.lastWaterMeter),
        electric: String(r.lastElectricMeter),
      };
    }
    return map;
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadMonth(month: string) {
    setBillingMonth(month);
    const res = await fetch(`/api/meters?month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms);
      const map: Record<string, ReadingRecord> = {};
      for (const r of data.readings) {
        map[r.roomId] = r;
      }
      setReadings(map);
    }
  }

  async function saveMeter(room: RoomMeter, postToFolio: boolean) {
    setErrorMsg("");
    setSavingId(room.id);
    const val = inputs[room.id];
    try {
      const res = await fetch("/api/meters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          billingMonth,
          currWater: Number(val?.water ?? room.lastWaterMeter),
          currElectric: Number(val?.electric ?? room.lastElectricMeter),
          postToFolio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setReadings((prev) => ({ ...prev, [room.id]: data.reading }));
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? {
                ...r,
                lastWaterMeter: Number(val?.water ?? r.lastWaterMeter),
                lastElectricMeter: Number(val?.electric ?? r.lastElectricMeter),
              }
            : r
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">จดมิเตอร์น้ำ-ไฟ</h1>
          <p className="hidden sm:block text-sm text-slate-500">
            น้ำ ฿{waterRate}/หน่วย • ไฟ ฿{electricRate}/หน่วย (โยนยอดเข้าบิลห้องพักอัตโนมัติได้)
          </p>
        </div>

        <input
          type="month"
          value={billingMonth}
          onChange={(e) => loadMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium"
        />
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => {
          const rec = readings[room.id];
          const activeStay = room.stays[0];
          const currentInput = inputs[room.id] || {
            water: String(room.lastWaterMeter),
            electric: String(room.lastElectricMeter),
          };

          return (
            <div
              key={room.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-base">
                    ห้อง {room.roomNumber}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {activeStay ? activeStay.guest.fullName : "ห้องว่าง"}
                  </span>
                </div>
                {rec && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    {rec.billed ? "จดและเข้าบิลแล้ว" : "จดแล้ว"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-cyan-50/70 border border-cyan-100 space-y-1.5">
                  <div className="flex items-center gap-1 text-xs font-semibold text-cyan-800">
                    <Droplets className="w-3.5 h-3.5" /> มิเตอร์น้ำ (เดิม: {room.lastWaterMeter})
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={currentInput.water}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [room.id]: { ...currentInput, water: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-md border border-cyan-200 bg-white text-sm font-mono"
                  />
                  {rec && (
                    <div className="text-[11px] text-cyan-900">
                      ใช้ {rec.waterUnits} หน่วย = ฿{rec.waterAmount.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100 space-y-1.5">
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                    <Zap className="w-3.5 h-3.5" /> มิเตอร์ไฟ (เดิม: {room.lastElectricMeter})
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={currentInput.electric}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [room.id]: { ...currentInput, electric: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-md border border-amber-200 bg-white text-sm font-mono"
                  />
                  {rec && (
                    <div className="text-[11px] text-amber-900">
                      ใช้ {rec.electricUnits} หน่วย = ฿{rec.electricAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={savingId === room.id}
                  onClick={() => saveMeter(room, false)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700"
                >
                  บันทึกเลขมิเตอร์
                </button>
                {activeStay?.folio && (
                  <button
                    disabled={savingId === room.id}
                    onClick={() => saveMeter(room, true)}
                    className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    บันทึก + โยนเข้า Folio
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
