"use client";

import { useState } from "react";
import { Check, KeyRound, Pencil, Plus, Save, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import {
  MENU_DEFINITIONS,
  ROLE_LABELS,
  getDefaultMenusForRole,
  resolveAllowedMenus,
  type UserRole,
} from "@/lib/roles";

interface SettingData {
  hotelName: string;
  taxId: string;
  address: string;
  phone: string;
  vatRate: number;
  serviceChargeRate: number;
  waterRatePerUnit: number;
  waterMinUnits: number;
  electricRatePerUnit: number;
  electricMinUnits: number;
  checkInTime: string;
  checkOutTime: string;
  shortTimeRate: number;
  shortTimeHours: number;
  defaultKeyDeposit: number;
  enableShortTime: boolean;
  enableMonthly: boolean;
}

interface RoomTypeData {
  id: string;
  code: string;
  name: string;
  baseDailyRate: number;
  baseMonthlyRate: number;
  maxOccupancy: number;
}

interface RoomData {
  id: string;
  roomNumber: string;
  floor: number;
  zone: string;
  status: string;
  roomTypeId: string;
  roomType: RoomTypeData;
}

interface StaffUser {
  id: string;
  username: string;
  name: string;
  role: string;
  allowedMenus?: string;
  active: boolean;
}

interface ResetRequestRow {
  id: string;
  username: string;
  note: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

export function SettingsClient({
  initialSetting,
  initialRoomTypes,
  initialRooms,
  initialUsers,
  initialResetRequests = [],
  currentUserRole,
}: {
  initialSetting: SettingData;
  initialRoomTypes: RoomTypeData[];
  initialRooms: RoomData[];
  initialUsers: StaffUser[];
  initialResetRequests?: ResetRequestRow[];
  currentUserRole: UserRole;
}) {
  const [setting, setSetting] = useState<SettingData>(initialSetting);
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>(initialRoomTypes);
  const [rooms, setRooms] = useState<RoomData[]>(initialRooms);
  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [resetRequests, setResetRequests] = useState<ResetRequestRow[]>(initialResetRequests);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [actionError, setActionError] = useState("");

  // New Room Form
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newFloor, setNewFloor] = useState(1);
  const [newZone, setNewZone] = useState("-");
  const [newRoomTypeId, setNewRoomTypeId] = useState(initialRoomTypes[0]?.id ?? "");

  // New Room Type Form
  const [rtCode, setRtCode] = useState("");
  const [rtName, setRtName] = useState("");
  const [rtDaily, setRtDaily] = useState(450);
  const [rtMonthly, setRtMonthly] = useState(13500);

  // Edit Room Type State
  const [editingRt, setEditingRt] = useState<RoomTypeData | null>(null);

  // Edit Room State
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);

  // Add Staff User State
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("FRONT_DESK");
  const [newMenus, setNewMenus] = useState<string[]>(() => getDefaultMenusForRole("FRONT_DESK"));

  // Edit Staff Password State
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [editingPasswordValue, setEditingPasswordValue] = useState("");
  const [passwordUpdatedUserId, setPasswordUpdatedUserId] = useState<string | null>(null);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });
      if (res.ok) {
        setSavedMsg("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      }
    } finally {
      setSaving(false);
    }
  }

  async function addRoomType(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_ROOM_TYPE",
        code: rtCode,
        name: rtName,
        baseDailyRate: rtDaily,
        baseMonthlyRate: rtMonthly,
      }),
    });
    if (res.ok) {
      const { roomType } = await res.json();
      setRoomTypes((prev) => [...prev, roomType]);
      setRtCode("");
      setRtName("");
    }
  }

  async function saveRoomType(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRt) return;
    setActionError("");
    const res = await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_ROOM_TYPE",
        id: editingRt.id,
        code: editingRt.code,
        name: editingRt.name,
        baseDailyRate: editingRt.baseDailyRate,
        baseMonthlyRate: editingRt.baseMonthlyRate,
        maxOccupancy: editingRt.maxOccupancy,
      }),
    });
    if (res.ok) {
      const { roomType } = await res.json();
      setRoomTypes((prev) => prev.map((r) => (r.id === roomType.id ? roomType : r)));
      setRooms((prev) =>
        prev.map((rm) => (rm.roomTypeId === roomType.id ? { ...rm, roomType } : rm))
      );
      setEditingRt(null);
    }
  }

  async function deleteRoomType(id: string) {
    setActionError("");
    const res = await fetch("/api/rooms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_ROOM_TYPE", id }),
    });
    if (res.ok) {
      setRoomTypes((prev) => prev.filter((r) => r.id !== id));
    } else {
      const data = await res.json();
      setActionError(data.error || "ลบประเภทห้องไม่สำเร็จ");
    }
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomNumber: newRoomNumber,
        floor: newFloor,
        zone: newZone,
        roomTypeId: newRoomTypeId,
      }),
    });
    if (res.ok) {
      const { room } = await res.json();
      setRooms((prev) => [...prev, room]);
      setNewRoomNumber("");
    }
  }

  async function saveRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoom) return;
    setActionError("");
    const res = await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_ROOM",
        id: editingRoom.id,
        roomNumber: editingRoom.roomNumber,
        floor: editingRoom.floor,
        zone: editingRoom.zone,
        roomTypeId: editingRoom.roomTypeId,
        status: editingRoom.status,
      }),
    });
    if (res.ok) {
      const { room } = await res.json();
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
      setEditingRoom(null);
    }
  }

  async function deleteRoom(id: string) {
    setActionError("");
    const res = await fetch("/api/rooms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_ROOM", id }),
    });
    if (res.ok) {
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } else {
      const data = await res.json();
      setActionError(data.error || "ลบห้องพักไม่สำเร็จ");
    }
  }

  async function addStaffUser(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        name: newFullName,
        password: newPassword,
        role: newRole,
        allowedMenus: newMenus,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => [...prev, data.user]);
      setNewUsername("");
      setNewFullName("");
      setNewPassword("");
      setNewMenus(getDefaultMenusForRole(newRole));
    } else {
      setActionError(data.error || "เพิ่มผู้ใช้งานไม่สำเร็จ");
    }
  }

  async function updateStaffUser(
    id: string,
    patch: { role?: string; active?: boolean; allowedMenus?: string[]; password?: string }
  ): Promise<boolean> {
    setActionError("");
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      return true;
    } else {
      setActionError(data.error || "แก้ไขข้อมูลผู้ใช้ไม่สำเร็จ");
      return false;
    }
  }

  async function saveStaffPassword(id: string) {
    if (editingPasswordValue.length < 4) {
      setActionError("รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }
    const ok = await updateStaffUser(id, { password: editingPasswordValue });
    if (ok) {
      setEditingPasswordUserId(null);
      setEditingPasswordValue("");
      setPasswordUpdatedUserId(id);
      setTimeout(() => {
        setPasswordUpdatedUserId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
        <p className="hidden sm:block text-sm text-slate-500">
          จัดการข้อมูลโรงแรม ภาษี ประเภทห้อง และหมายเลขห้องพัก
        </p>
      </div>

      {/* Property & Utility Settings */}
      <form
        onSubmit={saveSettings}
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">ข้อมูลทั่วไป ภาษี และมิเตอร์น้ำ-ไฟ</h2>
          {savedMsg && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="w-4 h-4" />
              {savedMsg}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อโรงแรม / ที่พัก</label>
            <input
              type="text"
              value={setting.hotelName}
              onChange={(e) => setSetting({ ...setting, hotelName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
            <input
              type="text"
              value={setting.taxId}
              onChange={(e) => setSetting({ ...setting, taxId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ที่อยู่</label>
            <input
              type="text"
              value={setting.address}
              onChange={(e) => setSetting({ ...setting, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              value={setting.phone}
              onChange={(e) => setSetting({ ...setting, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">VAT (%)</label>
            <input
              type="number"
              step="0.1"
              value={setting.vatRate}
              onChange={(e) => setSetting({ ...setting, vatRate: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ราคาห้องชั่วคราว (บาท)
            </label>
            <input
              type="number"
              min="0"
              value={setting.shortTimeRate ?? 400}
              onChange={(e) =>
                setSetting({ ...setting, shortTimeRate: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              เวลาชั่วคราว (ชั่วโมง)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={setting.shortTimeHours ?? 3}
              onChange={(e) =>
                setSetting({ ...setting, shortTimeHours: Math.max(1, Number(e.target.value)) })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ค่ามัดจำกุญแจ (บาท)
            </label>
            <input
              type="number"
              min="0"
              value={setting.defaultKeyDeposit ?? 200}
              onChange={(e) =>
                setSetting({
                  ...setting,
                  defaultKeyDeposit: Math.max(0, Number(e.target.value)),
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={setting.enableShortTime ?? true}
              onChange={(e) => setSetting({ ...setting, enableShortTime: e.target.checked })}
              className="w-4 h-4 accent-slate-900"
            />
            เปิดใช้งานเข้าพักชั่วคราว ({setting.shortTimeHours ?? 3} ชม.)
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={setting.enableMonthly ?? true}
              onChange={(e) => setSetting({ ...setting, enableMonthly: e.target.checked })}
              className="w-4 h-4 accent-slate-900"
            />
            เปิดใช้งานเช่ารายเดือน
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </form>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {/* Room Types & Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Types Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="font-semibold text-slate-800">ประเภทห้องพัก ({roomTypes.length})</h2>
          <div className="divide-y divide-slate-100">
            {roomTypes.map((rt) =>
              editingRt?.id === rt.id ? (
                <form key={rt.id} onSubmit={saveRoomType} className="py-3 space-y-2 bg-sky-50/50 p-2 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editingRt.code}
                      onChange={(e) => setEditingRt({ ...editingRt, code: e.target.value })}
                      className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                      placeholder="รหัส"
                      required
                    />
                    <input
                      value={editingRt.name}
                      onChange={(e) => setEditingRt({ ...editingRt, name: e.target.value })}
                      className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                      placeholder="ชื่อประเภทห้อง"
                      required
                    />
                    <div>
                      <label className="text-[10px] text-slate-500">รายวัน (฿)</label>
                      <input
                        type="number"
                        value={editingRt.baseDailyRate}
                        onChange={(e) =>
                          setEditingRt({ ...editingRt, baseDailyRate: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">รายเดือน (฿)</label>
                      <input
                        type="number"
                        value={editingRt.baseMonthlyRate}
                        onChange={(e) =>
                          setEditingRt({ ...editingRt, baseMonthlyRate: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingRt(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white text-xs"
                    >
                      <X className="w-3 h-3" /> ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium"
                    >
                      <Check className="w-3 h-3" /> บันทึก
                    </button>
                  </div>
                </form>
              ) : (
                <div key={rt.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 mr-2">
                      {rt.code}
                    </span>
                    <span className="font-medium text-slate-800">{rt.name}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      รายวัน ฿{rt.baseDailyRate.toLocaleString()} | รายเดือน ฿
                      {rt.baseMonthlyRate.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingRt(rt)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="แก้ไขประเภทห้อง"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRoomType(rt.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                      title="ลบประเภทห้อง"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <form onSubmit={addRoomType} className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <input
              placeholder="รหัส (เช่น VIP)"
              value={rtCode}
              onChange={(e) => setRtCode(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
              required
            />
            <input
              placeholder="ชื่อประเภทห้อง"
              value={rtName}
              onChange={(e) => setRtName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
              required
            />
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">ราคารายวัน (฿)</label>
              <input
                type="number"
                value={rtDaily}
                onChange={(e) => setRtDaily(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">ราคารายเดือน (฿)</label>
              <input
                type="number"
                value={rtMonthly}
                onChange={(e) => setRtMonthly(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>
            <button
              type="submit"
              className="col-span-2 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มประเภทห้อง
            </button>
          </form>
        </div>

        {/* Rooms Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="font-semibold text-slate-800">รายการห้องพัก ({rooms.length} ห้อง)</h2>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {rooms.map((r) =>
              editingRoom?.id === r.id ? (
                <form key={r.id} onSubmit={saveRoom} className="py-3 space-y-2 bg-sky-50/50 p-2 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editingRoom.roomNumber}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                      }
                      className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                      placeholder="เลขห้อง"
                      required
                    />
                    <select
                      value={editingRoom.roomTypeId}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, roomTypeId: e.target.value })
                      }
                      className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                    >
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editingRoom.floor}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, floor: Number(e.target.value) })
                      }
                      className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                      placeholder="โซน"
                      required
                    />
                    <input
                      value={editingRoom.zone}
                      onChange={(e) => setEditingRoom({ ...editingRoom, zone: e.target.value })}
                      className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                      placeholder="โซน"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={editingRoom.status}
                      onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })}
                      className="px-2.5 py-1 rounded border border-slate-300 text-xs bg-white"
                    >
                      <option value="VC">ว่างพร้อมพัก</option>
                      <option value="VD">รอทำความสะอาด</option>
                      <option value="OC">มีแขกพัก</option>
                      <option value="OOO">ปิดซ่อม</option>
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingRoom(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white text-xs"
                      >
                        <X className="w-3 h-3" /> ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium"
                      >
                        <Check className="w-3 h-3" /> บันทึก
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div key={r.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 mr-2">ห้อง {r.roomNumber}</span>
                    <span className="text-xs text-slate-500">
                      โซน {r.floor} • {r.zone} • {r.roomType.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 mr-1">
                      {r.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingRoom(r)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="แก้ไขห้องพัก"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRoom(r.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                      title="ลบห้องพัก"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <form onSubmit={addRoom} className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <input
              placeholder="เลขห้อง (เช่น 305)"
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
              required
            />
            <select
              value={newRoomTypeId}
              onChange={(e) => setNewRoomTypeId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">โซน</label>
              <input
                type="number"
                value={newFloor}
                onChange={(e) => setNewFloor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">โซน / อาคาร</label>
              <input
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>
            <button
              type="submit"
              className="col-span-2 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มห้องพัก
            </button>
          </form>
        </div>
      </div>

      {/* Pending Password Reset Requests */}
      {resetRequests.length > 0 && (
        <div
          id="password-resets"
          className="bg-amber-50 rounded-xl border-2 border-amber-300 p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-amber-950 text-sm">
              คำขอรีเซ็ตรหัสผ่านรออนุมัติ ({resetRequests.length} รายการ)
            </h2>
          </div>
          <div className="space-y-2">
            {resetRequests.map((req) => {
              const newPass = resetPasswords[req.id] ?? "1234";
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {req.user.name}{" "}
                      <span className="font-mono text-slate-500 font-normal">({req.username})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ROLE_LABELS[req.user.role as UserRole] ?? req.user.role} · ขอเมื่อ{" "}
                      {new Date(req.createdAt).toLocaleString("th-TH")}
                      {req.note ? ` · หมายเหตุ: ${req.note}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newPass}
                      onChange={(e) =>
                        setResetPasswords((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      placeholder="ตั้งรหัสผ่านใหม่"
                      className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setActionError("");
                        const res = await fetch("/api/auth/forgot-password", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: req.id,
                            action: "APPROVE",
                            newPassword: newPass,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setActionError(data.error || "อนุมัติไม่สำเร็จ");
                          return;
                        }
                        setResetRequests((prev) => prev.filter((r) => r.id !== req.id));
                        setSavedMsg(
                          `อนุมัติเปลี่ยนรหัสผ่านให้ ${req.user.name} เป็น "${newPass}" เรียบร้อยแล้ว`
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      อนุมัติ &amp; เปลี่ยนรหัส
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch("/api/auth/forgot-password", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: req.id, action: "REJECT" }),
                        });
                        if (res.ok) {
                          setResetRequests((prev) => prev.filter((r) => r.id !== req.id));
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff & Role Permissions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <div>
            <h2 className="font-semibold text-slate-800">
              จัดการพนักงานและกำหนดสิทธิ์ ({users.length} บัญชี)
            </h2>
            <p className="text-xs text-slate-500">
              ผู้จัดการ/เจ้าของสามารถเพิ่มพนักงาน เปลี่ยนตำแหน่งสิทธิ์ หรือเปิด-ปิดบัญชีผู้ใช้ได้
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {users.map((u) => {
            const isOwnerLocked = u.role === "OWNER" && currentUserRole !== "OWNER";
            const userMenus = resolveAllowedMenus(u.role as UserRole, u.allowedMenus);
            return (
              <div key={u.id} className="p-3.5 space-y-2.5 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {u.username}
                    </span>
                    <span className="font-semibold text-sm text-slate-900">{u.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      disabled={isOwnerLocked}
                      value={u.role}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        updateStaffUser(u.id, {
                          role: r,
                          allowedMenus: getDefaultMenusForRole(r),
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:opacity-60"
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => (
                        <option
                          key={roleKey}
                          value={roleKey}
                          disabled={roleKey === "OWNER" && currentUserRole !== "OWNER"}
                        >
                          {ROLE_LABELS[roleKey]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isOwnerLocked}
                      onClick={() => {
                        if (editingPasswordUserId === u.id) {
                          setEditingPasswordUserId(null);
                          setEditingPasswordValue("");
                        } else {
                          setEditingPasswordUserId(u.id);
                          setEditingPasswordValue("");
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      เปลี่ยนรหัสผ่าน
                    </button>
                    <button
                      type="button"
                      disabled={isOwnerLocked}
                      onClick={() => updateStaffUser(u.id, { active: !u.active })}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition disabled:opacity-50 ${
                        u.active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {u.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </button>
                  </div>
                </div>

                {passwordUpdatedUserId === u.id && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    เปลี่ยนรหัสผ่านของ {u.username} เรียบร้อยแล้ว
                  </div>
                )}

                {editingPasswordUserId === u.id && (
                  <div className="flex flex-wrap items-center gap-2 bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
                    <input
                      type="password"
                      placeholder="รหัสผ่านใหม่ (4+ ตัวอักษร)"
                      value={editingPasswordValue}
                      onChange={(e) => setEditingPasswordValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveStaffPassword(u.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs min-w-[200px] flex-1 max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => saveStaffPassword(u.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                    >
                      <Save className="w-3.5 h-3.5" />
                      บันทึกรหัสผ่าน
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPasswordUserId(null);
                        setEditingPasswordValue("");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs hover:bg-slate-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      ยกเลิก
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-slate-500 mr-1 self-center">
                    เมนูที่เข้าได้:
                  </span>
                  {MENU_DEFINITIONS.map((m) => {
                    const checked = userMenus.includes(m.href);
                    return (
                      <label
                        key={m.href}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer select-none transition ${
                          checked
                            ? "bg-sky-50 border-sky-300 text-sky-800"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        } ${isOwnerLocked ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isOwnerLocked}
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? userMenus.filter((x) => x !== m.href)
                              : [...userMenus, m.href];
                            updateStaffUser(u.id, { allowedMenus: next });
                          }}
                          className="accent-sky-600"
                        />
                        {m.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={addStaffUser}
          className="pt-3 border-t border-slate-100 space-y-2.5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            required
            placeholder="Username (เช่น staff01)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
          />
          <input
            required
            placeholder="ชื่อ-นามสกุลพนักงาน"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
          />
          <input
            required
            type="password"
            placeholder="รหัสผ่าน (4+ ตัว)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
          />
          <select
            value={newRole}
            onChange={(e) => {
              const r = e.target.value as UserRole;
              setNewRole(r);
              setNewMenus(getDefaultMenusForRole(r));
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => (
              <option
                key={roleKey}
                value={roleKey}
                disabled={roleKey === "OWNER" && currentUserRole !== "OWNER"}
              >
                {ROLE_LABELS[roleKey]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" /> เพิ่มพนักงาน
          </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1 self-center">
              เมนูที่เข้าได้สำหรับพนักงานใหม่:
            </span>
            {MENU_DEFINITIONS.map((m) => {
              const checked = newMenus.includes(m.href);
              return (
                <label
                  key={m.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer select-none transition ${
                    checked
                      ? "bg-sky-50 border-sky-300 text-sky-800"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setNewMenus((prev) =>
                        checked ? prev.filter((x) => x !== m.href) : [...prev, m.href]
                      )
                    }
                    className="accent-sky-600"
                  />
                  {m.label}
                </label>
              );
            })}
          </div>
        </form>
      </div>
    </div>
  );
}
