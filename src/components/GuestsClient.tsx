"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

interface GuestStay {
  id: string;
  bookingCode: string;
  stayType: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  room: { roomNumber: string };
  folio: {
    id: string;
    status: string;
    balance: number;
    totalCharges: number;
    totalPayments: number;
  } | null;
}

interface GuestRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  nationality: string;
  address: string;
  vehiclePlate: string;
  preferences: string;
  tag: string;
  stays: GuestStay[];
}

interface PropertySettingInfo {
  hotelName: string;
  taxId: string;
  address: string;
  phone: string;
}

type GuestFilter = "ALL" | "HAS_DEBT" | "CREDIT" | "CASH";

export function GuestsClient({
  initialGuests,
  setting,
}: {
  initialGuests: GuestRow[];
  setting: PropertySettingInfo;
}) {
  const [guests, setGuests] = useState<GuestRow[]>(initialGuests);
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<GuestFilter>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [tag, setTag] = useState("NORMAL");

  const [editingGuest, setEditingGuest] = useState<GuestRow | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editIdNumber, setEditIdNumber] = useState("");
  const [editVehiclePlate, setEditVehiclePlate] = useState("");
  const [editPreferences, setEditPreferences] = useState("");
  const [editTag, setEditTag] = useState("NORMAL");
  const [savingEdit, setSavingEdit] = useState(false);

  const [invoiceGuest, setInvoiceGuest] = useState<GuestRow | null>(null);

  function getUnpaidStays(g: GuestRow) {
    return g.stays.filter((s) => s.folio && s.folio.balance > 0);
  }

  function getGuestDebt(g: GuestRow) {
    return getUnpaidStays(g).reduce((sum, s) => sum + (s.folio?.balance ?? 0), 0);
  }

  function openEdit(g: GuestRow) {
    setEditingGuest(g);
    setEditFullName(g.fullName);
    setEditPhone(g.phone);
    setEditEmail(g.email || "");
    setEditAddress(g.address || "");
    setEditIdNumber(g.idNumber);
    setEditVehiclePlate(g.vehiclePlate);
    setEditPreferences(g.preferences);
    setEditTag(g.tag);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGuest) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGuest.id,
          fullName: editFullName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          idNumber: editIdNumber,
          vehiclePlate: editVehiclePlate,
          preferences: editPreferences,
          tag: editTag,
        }),
      });
      if (res.ok) {
        const { guest } = await res.json();
        setGuests((prev) =>
          prev.map((g) => (g.id === editingGuest.id ? { ...guest, stays: g.stays } : g))
        );
        setEditingGuest(null);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  const unpaidGuestsCount = guests.filter((g) => getGuestDebt(g) > 0).length;
  const creditTagCount = guests.filter((g) => g.tag === "CREDIT").length;
  const totalCreditBalance = guests.reduce((sum, g) => sum + getGuestDebt(g), 0);

  const filtered = guests.filter((g) => {
    const matchesQuery =
      g.fullName.toLowerCase().includes(query.toLowerCase()) ||
      g.phone.includes(query) ||
      g.idNumber.includes(query);
    if (!matchesQuery) return false;
    if (filterMode === "HAS_DEBT") return getGuestDebt(g) > 0;
    if (filterMode === "CREDIT") return g.tag === "CREDIT" || getGuestDebt(g) > 0;
    if (filterMode === "CASH") return g.tag !== "CREDIT";
    return true;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        email,
        address,
        idNumber,
        vehiclePlate,
        tag,
      }),
    });
    if (res.ok) {
      const { guest } = await res.json();
      setGuests((prev) => [{ ...guest, stays: [] }, ...prev]);
      setFullName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setIdNumber("");
      setVehiclePlate("");
      setShowAdd(false);
    }
  }

  async function updateTag(id: string, newTag: string) {
    const res = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tag: newTag }),
    });
    if (res.ok) {
      setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, tag: newTag } : g)));
    }
  }

  async function handleDelete(g: GuestRow) {
    if (!window.confirm(`ยืนยันลบข้อมูลลูกค้า "${g.fullName}"?`)) return;
    const res = await fetch("/api/guests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: g.id }),
    });
    if (res.ok) {
      setGuests((prev) => prev.filter((item) => item.id !== g.id));
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || "ไม่สามารถลบข้อมูลลูกค้าได้");
    }
  }

  return (
    <>
    <div className={`space-y-3 sm:space-y-5 ${invoiceGuest ? "no-print" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">ฐานข้อมูลลูกค้า</h1>
          <p className="hidden sm:block text-sm text-slate-500">
            ทะเบียนผู้เข้าพัก รายชื่อ VIP / Blacklist และประวัติการเข้าพัก
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:hidden">เพิ่มลูกค้า</span>
          <span className="hidden sm:inline">เพิ่มข้อมูลลูกค้า</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              placeholder="ชื่อ-นามสกุล / ชื่อบริษัท *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <input
              required
              placeholder="เบอร์โทร *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <input
              placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)"
              inputMode="numeric"
              maxLength={13}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              placeholder="ที่อยู่ออกใบแจ้งหนี้ / ใบกำกับภาษี"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <input
              placeholder="อีเมล"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <input
              placeholder="ทะเบียนรถ"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">ประเภทลูกค้า:</span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="NORMAL">เงินสด</option>
                <option value="CREDIT">เครดิต</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              บันทึกข้อมูลลูกค้า
            </button>
          </div>
        </form>
      )}

      {/* Credit Summary & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "ALL" as GuestFilter, label: `ทั้งหมด (${guests.length})` },
            { key: "HAS_DEBT" as GuestFilter, label: `มีเครดิตค้างชำระ (${unpaidGuestsCount})` },
            { key: "CREDIT" as GuestFilter, label: `เครดิต (${creditTagCount})` },
            { key: "CASH" as GuestFilter, label: `เงินสด (${guests.length - creditTagCount})` },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterMode(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === f.key
                  ? f.key === "HAS_DEBT"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 shrink-0">
          ยอดเครดิตค้างชำระรวม:{" "}
          <span className="font-extrabold text-rose-600">
            ฿{totalCreditBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อ, เบอร์โทร, หรือเลขประจำตัวผู้เสียภาษี..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((g) => {
          const unpaidStays = getUnpaidStays(g);
          const debt = getGuestDebt(g);
          return (
          <div
            key={g.id}
            className={`bg-white rounded-xl border p-4 shadow-xs space-y-2 ${
              debt > 0 ? "border-rose-200" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{g.fullName}</div>
                  <div className="text-xs text-slate-500">
                    {g.phone} {g.idNumber ? `• ${g.idNumber}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(g)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                >
                  <Pencil className="w-3 h-3" /> แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(g)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600"
                  title="ลบข้อมูลลูกค้า"
                >
                  <Trash2 className="w-3 h-3" /> ลบ
                </button>
                <select
                  value={g.tag === "CREDIT" ? "CREDIT" : "NORMAL"}
                  onChange={(e) => updateTag(g.id, e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                    g.tag === "CREDIT"
                      ? "bg-sky-50 border-sky-200 text-sky-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  <option value="NORMAL">เงินสด</option>
                  <option value="CREDIT">เครดิต</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
              {g.tag === "CREDIT" ? (
                <span className="inline-flex items-center gap-1 text-sky-700 font-semibold">
                  ลูกค้าเครดิต
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  ลูกค้าเงินสด
                </span>
              )}
              {g.address && <span>ที่อยู่: {g.address}</span>}
              {g.email && <span>อีเมล: {g.email}</span>}
              {g.vehiclePlate && <span>ทะเบียน: {g.vehiclePlate}</span>}
              {g.preferences && <span>หมายเหตุ: {g.preferences}</span>}
            </div>

            {debt > 0 && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-rose-900">เครดิตค้างชำระ ({unpaidStays.length} บิล): </span>
                    <span className="font-extrabold text-rose-600 text-sm">
                      ฿{debt.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInvoiceGuest(g)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" /> ทำใบแจ้งหนี้
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unpaidStays.map((s) => (
                    <Link
                      key={s.id}
                      href={`/billing?folioId=${s.folio?.id}`}
                      className="text-[11px] px-2 py-0.5 rounded bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-medium"
                    >
                      ห้อง {s.room.roomNumber} ({s.bookingCode}) • ค้าง ฿
                      {(s.folio?.balance ?? 0).toLocaleString("th-TH")} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {g.stays.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {g.stays.slice(0, 5).map((s) => (
                  <span
                    key={s.id}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                  >
                    ห้อง {s.room.roomNumber} ({s.bookingCode})
                  </span>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {editingGuest && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setEditingGuest(null)}
        >
          <form
            onSubmit={handleEditSave}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900">แก้ไขข้อมูลลูกค้า</h2>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    เบอร์โทร
                  </label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ประเภทลูกค้า
                  </label>
                  <select
                    value={editTag === "CREDIT" ? "CREDIT" : "NORMAL"}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="NORMAL">เงินสด</option>
                    <option value="CREDIT">เครดิต</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  </label>
                  <input
                    inputMode="numeric"
                    maxLength={13}
                    placeholder="ตัวเลข 13 หลัก"
                    value={editIdNumber}
                    onChange={(e) => setEditIdNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ทะเบียนรถ
                  </label>
                  <input
                    value={editVehiclePlate}
                    onChange={(e) => setEditVehiclePlate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ที่อยู่ออกใบแจ้งหนี้ / ใบกำกับภาษี
                </label>
                <input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="ที่อยู่สำหรับออกบิล / วางบิล..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  หมายเหตุ / ความต้องการพิเศษ
                </label>
                <input
                  value={editPreferences}
                  onChange={(e) => setEditPreferences(e.target.value)}
                  placeholder="เช่น ขอหมอนเพิ่ม, แพ้อาหาร..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {savingEdit ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>

      {/* Printable Credit Invoice / Billing Statement Modal */}
      {invoiceGuest && (() => {
        const unpaid = getUnpaidStays(invoiceGuest);
        const totalDue = getGuestDebt(invoiceGuest);
        return (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print-overlay"
            onClick={() => setInvoiceGuest(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print-a4"
            >
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between print:hidden">
                <h2 className="font-bold text-sm text-slate-900">ใบแจ้งหนี้ / ใบวางบิล (เครดิต)</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5" /> พิมพ์ใบแจ้งหนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceGuest(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 text-sm">
                <div className="flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{setting.hotelName}</div>
                    {setting.address && <div className="text-xs text-slate-500">{setting.address}</div>}
                    <div className="text-xs text-slate-500">
                      {setting.phone ? `โทร ${setting.phone}` : ""}
                      {setting.taxId ? ` · เลขผู้เสียภาษี ${setting.taxId}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-rose-700">ใบแจ้งหนี้ / ใบวางบิล</div>
                    <div className="text-xs text-slate-500">
                      วันที่ออกเอกสาร:{" "}
                      {new Date().toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    เรียกเก็บเงินจาก: {invoiceGuest.fullName}
                  </div>
                  {invoiceGuest.idNumber && (
                    <div className="text-slate-600 font-mono">
                      เลขประจำตัวผู้เสียภาษี / บัตรประชาชน: {invoiceGuest.idNumber}
                    </div>
                  )}
                  {invoiceGuest.address && (
                    <div className="text-slate-600">ที่อยู่: {invoiceGuest.address}</div>
                  )}
                  <div className="text-slate-600">
                    โทร: {invoiceGuest.phone || "-"}
                    {invoiceGuest.email ? ` · อีเมล: ${invoiceGuest.email}` : ""}
                  </div>
                </div>

                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">รหัสเข้าพัก / ห้อง</th>
                      <th className="text-left px-3 py-2 font-semibold">วันที่เข้าพัก</th>
                      <th className="text-right px-3 py-2 font-semibold">ยอดรวม</th>
                      <th className="text-right px-3 py-2 font-semibold">ชำระแล้ว</th>
                      <th className="text-right px-3 py-2 font-semibold">ยอดค้างชำระ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unpaid.map((s) => (
                      <tr key={s.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          ห้อง {s.room.roomNumber} ({s.bookingCode})
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {new Date(s.checkInDate).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          ฿{(s.folio?.totalCharges ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-700">
                          ฿{(s.folio?.totalPayments ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-rose-600">
                          ฿{(s.folio?.balance ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-rose-50 border-t border-rose-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2.5 text-right font-bold text-rose-950">
                        รวมยอดแจ้งหนี้สุทธิ ({unpaid.length} รายการ)
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-rose-600 text-sm">
                        ฿{totalDue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
