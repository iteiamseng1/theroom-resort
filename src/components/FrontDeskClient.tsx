"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResortLogo } from "@/components/ResortLogo";
import { ThaiCalendarPicker } from "@/components/ThaiCalendarPicker";
import {
  ArrowRightLeft,
  BedDouble,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Loader2,
  LogOut,
  Plus,
  Printer,
  Receipt,
  Wrench,
  X,
} from "lucide-react";

interface RoomItem {
  id: string;
  roomNumber: string;
  floor: number;
  zone: string;
  status: string;
  notes: string;
  roomType: {
    id: string;
    code: string;
    name: string;
    baseDailyRate: number;
    baseMonthlyRate: number;
  };
  stays: Array<{
    id: string;
    bookingCode: string;
    stayType: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    rateAmount: number;
    securityDeposit: number;
    keyDeposit?: number;
    keyDepositMethod?: string;
    keyDepositStatus?: string;
    keyDepositRefunded?: number;
    guest: { id: string; fullName: string; phone: string; idNumber?: string; tag: string };
    folio: { id: string; balance: number } | null;
  }>;
}

const STATUS_STYLE: Record<string, { label: string; badge: string; card: string }> = {
  VC: {
    label: "ว่างพร้อมพัก",
    badge: "bg-emerald-100 text-emerald-700",
    card: "border-emerald-200 bg-white hover:border-emerald-400",
  },
  VD: {
    label: "รอทำความสะอาด",
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200 bg-amber-50/40 hover:border-amber-400",
  },
  OC: {
    label: "มีแขกพัก",
    badge: "bg-sky-100 text-sky-800",
    card: "border-sky-300 bg-sky-50/50 hover:border-sky-500",
  },
  OD: {
    label: "มีแขกพัก/รอทำความสะอาด",
    badge: "bg-indigo-100 text-indigo-800",
    card: "border-indigo-300 bg-indigo-50/40",
  },
  OOO: {
    label: "ปิดซ่อม",
    badge: "bg-rose-100 text-rose-700",
    card: "border-rose-200 bg-rose-50/50",
  },
};

interface GuestSuggestion {
  id: string;
  fullName: string;
  phone: string;
  idNumber: string;
  tag: string;
}

export function FrontDeskClient({
  initialRooms,
  initialGuests = [],
  propertySetting,
}: {
  initialRooms: RoomItem[];
  initialGuests?: GuestSuggestion[];
  propertySetting?: {
    hotelName: string;
    address: string;
    phone: string;
    taxId: string;
    shortTimeRate?: number;
    shortTimeHours?: number;
    defaultKeyDeposit?: number;
    enableShortTime?: boolean;
    enableMonthly?: boolean;
  };
}) {
  const shortTimeRate = propertySetting?.shortTimeRate ?? 400;
  const shortTimeHours = propertySetting?.shortTimeHours ?? 3;
  const defaultKeyDeposit = propertySetting?.defaultKeyDeposit ?? 200;
  const enableShortTime = propertySetting?.enableShortTime ?? true;
  const enableMonthly = propertySetting?.enableMonthly ?? true;
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [guests, setGuests] = useState<GuestSuggestion[]>(initialGuests);
  const [guestSuggestField, setGuestSuggestField] = useState<"name" | "phone" | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Booking / Walk-in Form State
  const [stayType, setStayType] = useState<"DAILY" | "MONTHLY" | "SHORT_TIME">("DAILY");
  const [extendStayId, setExtendStayId] = useState<string | null>(null);
  const [extendCharge, setExtendCharge] = useState<number>(100);
  const [checkInNow, setCheckInNow] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [rateAmount, setRateAmount] = useState(900);
  const [depositAmount, setDepositAmount] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [keyDeposit, setKeyDeposit] = useState(defaultKeyDeposit);
  const [keyDepositMethod, setKeyDepositMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [collectNow, setCollectNow] = useState(true);
  const [collectMethod, setCollectMethod] = useState<"CASH" | "TRANSFER" | "CREDIT_CARD">("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [checkoutStay, setCheckoutStay] = useState<RoomItem["stays"][number] | null>(null);
  const [refundMode, setRefundMode] = useState<"RETURN" | "FORFEIT">("RETURN");
  const [refundAmount, setRefundAmount] = useState(200);
  const [refundMethod, setRefundMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Room Move
  const [moveTargetId, setMoveTargetId] = useState("");

  // Maintenance / Cleaning quick form in Room Modal
  const [maintNote, setMaintNote] = useState("");
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [sendingCleaning, setSendingCleaning] = useState(false);
  const [cleaningToast, setCleaningToast] = useState<string | null>(null);

  // Quick Payment & Receipt in Room Modal
  const [payStayId, setPayStayId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>("CASH");
  const [payRef, setPayRef] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);
  const [payReceipt, setPayReceipt] = useState<{
    bookingCode: string;
    roomNumber: string;
    guestName: string;
    guestTaxId?: string;
    amount: number;
    method: string;
    referenceNo: string;
    remainingBalance: number;
    paidAt: string;
    items: { id: string; category: string; description: string; amount: number }[];
  } | null>(null);

  async function refreshRooms() {
    const res = await fetch("/api/rooms");
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms);
      if (selectedRoom) {
        const updated = data.rooms.find((r: RoomItem) => r.id === selectedRoom.id);
        setSelectedRoom(updated || null);
      }
    }
    const gRes = await fetch("/api/guests");
    if (gRes.ok) {
      const gData = await gRes.json();
      setGuests(gData.guests || []);
    }
  }

  function openNewBookingForRoom(room: RoomItem) {
    setSelectedRoom(room);
    setStayType("DAILY");
    setRateAmount(room.roomType.baseDailyRate);
    setDepositAmount(0);
    setSecurityDeposit(0);
    setKeyDeposit(defaultKeyDeposit);
    setKeyDepositMethod("CASH");
    setCheckInNow(room.status === "VC");
    setCollectNow(room.status === "VC");
    setCollectMethod("CASH");
    setCollectRef("");
    setGuestName("");
    setGuestPhone("");
    setSelectedGuestId(null);
    setIdNumber("");
    setError("");
    setShowBookingModal(true);
  }

  function formatTimeHM(isoOrDate: string | Date) {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function formatDurationMins(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} ชม. ${m} น.`;
    if (h > 0) return `${h} ชม.`;
    return `${m} น.`;
  }

  function getShortTimeAlert(checkOutIso: string) {
    const diffMins = Math.round((new Date(checkOutIso).getTime() - nowMs) / 60000);
    if (diffMins < 0) {
      return {
        label: `เกินเวลา ${formatDurationMins(Math.abs(diffMins))}`,
        cls: "bg-rose-100 text-rose-700 border-rose-300",
      };
    }
    if (diffMins <= 30) {
      return {
        label: `ใกล้หมด · เหลือ ${diffMins} น.`,
        cls: "bg-amber-100 text-amber-800 border-amber-300",
      };
    }
    return {
      label: `เหลือ ${formatDurationMins(diffMins)}`,
      cls: "bg-sky-50 text-sky-700 border-sky-200",
    };
  }

  async function handleCreateStay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom) return;
    const cleanTaxId = idNumber.trim();
    if (cleanTaxId.length > 0 && !/^\d{13}$/.test(cleanTaxId)) {
      setError("กรุณากรอกเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก (ตัวเลขเท่านั้น)");
      return;
    }
    setSubmitting(true);
    setError("");
    const resolvedGuest =
      (selectedGuestId ? guests.find((g) => g.id === selectedGuestId) : null) ??
      (guestName.trim()
        ? guests.find((g) => g.fullName.trim().toLowerCase() === guestName.trim().toLowerCase())
        : null);
    const shouldCollectNow = checkInNow && resolvedGuest?.tag !== "CREDIT";
    try {
      let checkInIso = `${checkInDate}T14:00:00`;
      let checkOutIso = `${checkOutDate}T12:00:00`;
      if (stayType === "SHORT_TIME") {
        const start = new Date();
        const end = new Date(start.getTime() + shortTimeHours * 3600 * 1000);
        checkInIso = start.toISOString();
        checkOutIso = end.toISOString();
      }
      const res = await fetch("/api/stays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          stayType,
          checkInNow,
          guestId: selectedGuestId ?? undefined,
          guestName,
          guestPhone,
          idNumber: idNumber.trim(),
          checkInDate: checkInIso,
          checkOutDate: checkOutIso,
          rateAmount,
          depositAmount,
          securityDeposit: stayType === "MONTHLY" ? securityDeposit : 0,
          keyDeposit,
          keyDepositMethod: collectMethod === "TRANSFER" ? "TRANSFER" : "CASH",
          collectFullPayment: shouldCollectNow,
          paymentMethod: collectMethod,
          paymentReferenceNo: collectRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setShowBookingModal(false);
      await refreshRooms();
      if (shouldCollectNow && data.stay?.folio) {
        const paidAmt = Number(data.stay.folio.totalPayments ?? 0);
        if (paidAmt > 0) {
          setPayReceipt({
            bookingCode: data.stay.bookingCode,
            roomNumber: selectedRoom.roomNumber,
            guestName: data.stay.guest?.fullName || guestName,
            guestTaxId: data.stay.guest?.idNumber || idNumber.trim() || undefined,
            amount: paidAmt,
            method: collectMethod,
            referenceNo: collectRef,
            remainingBalance: Number(data.stay.folio.balance ?? 0),
            paidAt: new Date().toLocaleString("th-TH"),
            items: Array.isArray(data.stay.folio.items) ? data.stay.folio.items : [],
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStayAction(
    stayId: string,
    action: "CHECK_IN" | "CHECK_OUT" | "CANCEL" | "ROOM_MOVE",
    newRoomId?: string,
    extra?: {
      keyDepositAction?: "RETURN" | "FORFEIT";
      keyDepositRefunded?: number;
      keyDepositRefundMethod?: "CASH" | "TRANSFER";
    }
  ) {
    const res = await fetch("/api/stays", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stayId, action, newRoomId, ...extra }),
    });
    if (res.ok) {
      setMoveTargetId("");
      await refreshRooms();
    } else {
      const data = await res.json();
      alert(data.error || "ดำเนินการไม่สำเร็จ");
    }
  }

  async function handleExtendShortTime(stayId: string) {
    const res = await fetch("/api/stays", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stayId,
        action: "EXTEND_SHORT_TIME",
        extendHours: 1,
        extraCharge: Math.max(0, Number(extendCharge) || 0),
      }),
    });
    if (res.ok) {
      setExtendStayId(null);
      await refreshRooms();
    } else {
      const data = await res.json();
      alert(data.error || "ต่อเวลาไม่สำเร็จ");
    }
  }

  async function startCheckOut(stay: RoomItem["stays"][number]) {
    if (checkingOut) return;
    if ((stay.keyDeposit ?? 0) > 0 && stay.keyDepositStatus === "HELD") {
      setCheckoutStay(stay);
      setRefundMode("RETURN");
      setRefundAmount(stay.keyDeposit ?? 200);
      setRefundMethod(stay.keyDepositMethod === "TRANSFER" ? "TRANSFER" : "CASH");
      return;
    }
    setCheckingOut(true);
    try {
      await handleStayAction(stay.id, "CHECK_OUT");
    } finally {
      setCheckingOut(false);
    }
  }

  async function confirmCheckOutWithRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutStay) return;
    setCheckingOut(true);
    try {
      await handleStayAction(checkoutStay.id, "CHECK_OUT", undefined, {
        keyDepositAction: refundMode,
        keyDepositRefunded: refundMode === "RETURN" ? (checkoutStay.keyDeposit ?? 0) : refundAmount,
        keyDepositRefundMethod: refundMethod,
      });
      setCheckoutStay(null);
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleRoomStatus(roomId: string, status: string) {
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId, status }),
    });
    await refreshRooms();
  }

  async function handleRequestCleaning(roomId: string, roomNumber?: string) {
    if (sendingCleaning) return;
    setSendingCleaning(true);
    try {
      const res = await fetch("/api/housekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          type: "CLEANING",
          priority: "HIGH",
          notes: "แจ้งทำความสะอาดจากหน้าฟรอนต์",
        }),
      });
      if (res.ok) {
        await refreshRooms();
        const label = roomNumber ? `แจ้งแม่บ้านแล้ว (ห้อง ${roomNumber})` : "แจ้งแม่บ้านแล้ว";
        setCleaningToast(label);
        setTimeout(() => {
          setCleaningToast((prev) => (prev === label ? null : prev));
        }, 3500);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "ส่งแจ้งแม่บ้านไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSendingCleaning(false);
    }
  }

  async function handleReportMaintenance(e: React.FormEvent, roomId: string) {
    e.preventDefault();
    await fetch("/api/housekeeping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        type: "MAINTENANCE",
        priority: "HIGH",
        notes: maintNote || "แจ้งซ่อมจากหน้าฟรอนต์",
        setOutOfOrder: true,
      }),
    });
    setMaintNote("");
    setShowMaintForm(false);
    await refreshRooms();
  }

  async function handleQuickPayment(
    e: React.FormEvent,
    stay: RoomItem["stays"][number],
    roomNumber: string
  ) {
    e.preventDefault();
    if (!stay.folio || isPaying) return;
    const amt = payAmount > 0 ? payAmount : stay.folio.balance;
    if (amt <= 0) return;

    setIsPaying(true);
    try {
      const res = await fetch("/api/folios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_PAYMENT",
          folioId: stay.folio.id,
          amount: amt,
          method: payMethod,
          referenceNo: payRef,
          source: "FRONT_DESK",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayReceipt({
          bookingCode: stay.bookingCode,
          roomNumber,
          guestName: stay.guest.fullName,
          guestTaxId: stay.guest.idNumber || undefined,
          amount: amt,
          method: payMethod,
          referenceNo: payRef,
          remainingBalance: data.folio.balance,
          paidAt: new Date().toLocaleString("th-TH"),
          items: Array.isArray(data.folio.items) ? data.folio.items : [],
        });
        setPayStayId(null);
        setPayRef("");
        void refreshRooms();
      } else {
        const err = await res.json();
        alert(err.error || "ชำระเงินไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsPaying(false);
    }
  }

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "OC") return r.status === "OC" || r.status === "OD";
    if (filterStatus === "VD") return r.status === "VD" || r.status === "OD";
    if (filterStatus === "OOO") return r.status === "OOO" || r.status === "OOS";
    return r.status === filterStatus;
  });
  const roomZones = [
    {
      key: "Z1",
      title: "โซน 1 (101-106)",
      rooms: filteredRooms.filter((r) => r.zone === "โซน 1" || (r.roomType.code !== "VIP" && r.floor === 1)),
    },
    {
      key: "Z2",
      title: "โซน 2 (201-206)",
      rooms: filteredRooms.filter((r) => r.zone === "โซน 2" || (r.roomType.code !== "VIP" && r.floor === 2)),
    },
    {
      key: "Z3",
      title: "โซน 3 (301-306)",
      rooms: filteredRooms.filter((r) => r.zone === "โซน 3" || (r.roomType.code !== "VIP" && r.floor === 3)),
    },
    {
      key: "Z4",
      title: "โซน 4 (401-408)",
      rooms: filteredRooms.filter((r) => r.zone === "โซน 4" || (r.roomType.code !== "VIP" && r.floor === 4)),
    },
    {
      key: "VIP",
      title: "โซน VIP (VIP1-VIP2)",
      rooms: filteredRooms.filter((r) => r.roomType.code === "VIP"),
    },
  ];
  const vcRooms = rooms.filter((r) => r.status === "VC");

  return (
    <>
    <div className={`space-y-3 sm:space-y-6 ${payReceipt ? "no-print" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">หน้าฟรอนต์ &amp; ผังห้องพัก</h1>
          <p className="hidden sm:block text-sm text-slate-500">
            คลิกที่ห้องเพื่อรับ Check-in / Check-out หรือย้ายห้อง
          </p>
        </div>

        <div className="grid grid-cols-5 gap-1 sm:flex sm:flex-wrap sm:gap-1.5">
          {[
            { key: "ALL", label: "ทั้งหมด", count: rooms.length },
            { key: "VC", label: "พร้อม", count: rooms.filter((r) => r.status === "VC").length },
            {
              key: "OC",
              label: "มีแขกพัก",
              count: rooms.filter((r) => r.status === "OC" || r.status === "OD").length,
            },
            {
              key: "VD",
              label: "ทำความสะอาด",
              count: rooms.filter((r) => r.status === "VD" || r.status === "OD").length,
            },
            {
              key: "OOO",
              label: "ปิดซ่อม",
              count: rooms.filter((r) => r.status === "OOO" || r.status === "OOS").length,
            },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-1 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition flex flex-col sm:flex-row items-center justify-center sm:gap-1 leading-tight ${
                filterStatus === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="truncate max-w-full">{f.label}</span>
              <span className="font-bold">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Room Rack by Zone (ปกติ / VIP) */}
      {roomZones.map((zoneGroup) => {
        if (zoneGroup.rooms.length === 0) return null;

        return (
          <div key={zoneGroup.key} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BedDouble
                className={`w-4 h-4 ${
                  zoneGroup.key === "VIP" ? "text-amber-500" : "text-slate-400"
                }`}
              />
              {zoneGroup.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {zoneGroup.rooms.map((room) => {
                const style = STATUS_STYLE[room.status] || STATUS_STYLE.VC;
                const activeStay = room.stays.find((s) => s.status === "CHECKED_IN");
                const reservedStay = room.stays.find((s) => s.status === "RESERVED");

                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedRoom(room);
                      setPayStayId(null);
                      setExtendStayId(null);
                    }}
                    className={`text-left p-3 rounded-xl border-2 transition shadow-xs flex flex-col justify-between min-h-[116px] ${style.card}`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div>
                        <div className="text-lg font-bold text-slate-900">{room.roomNumber}</div>
                        <div className="text-[11px] text-slate-500">{room.roomType.name}</div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/70 w-full">
                      {activeStay ? (
                        <div>
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {activeStay.guest.fullName}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                            <span>
                              {activeStay.stayType === "MONTHLY"
                                ? "รายเดือน"
                                : activeStay.stayType === "SHORT_TIME"
                                  ? `ชั่วคราว (${formatTimeHM(activeStay.checkInDate)}→${formatTimeHM(activeStay.checkOutDate)})`
                                  : "รายวัน"}
                            </span>
                            {activeStay.folio && activeStay.folio.balance > 0 && (
                              <span className="font-semibold text-rose-600">
                                ค้าง ฿{activeStay.folio.balance.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {activeStay.stayType === "SHORT_TIME" && (() => {
                            const alertInfo = getShortTimeAlert(activeStay.checkOutDate);
                            return (
                              <div
                                className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${alertInfo.cls}`}
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                {alertInfo.label}
                              </div>
                            );
                          })()}
                        </div>
                      ) : reservedStay ? (
                        <div className="text-xs text-sky-700 font-medium truncate">
                          จอง: {reservedStay.guest.fullName}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">
                          ฿{room.roomType.baseDailyRate.toLocaleString()}/คืน
                          {enableMonthly
                            ? ` • ฿${room.roomType.baseMonthlyRate.toLocaleString()}/ด.`
                            : ""}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Room Detail Drawer / Modal */}
      {selectedRoom && !showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ห้อง {selectedRoom.roomNumber} — {selectedRoom.roomType.name}
                </h3>
                <p className="text-xs text-slate-500">
                  โซน {selectedRoom.floor} • {selectedRoom.zone} • สถานะ {(STATUS_STYLE[selectedRoom.status] || STATUS_STYLE.VC).label}
                </p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Active / Reserved Stays */}
            {selectedRoom.stays.length > 0 ? (
              <div className="space-y-3">
                {selectedRoom.stays.map((stay) => (
                  <div
                    key={stay.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {stay.bookingCode}
                        </span>
                        <div className="font-bold text-slate-900 mt-1">{stay.guest.fullName}</div>
                        <div className="text-xs text-slate-500">
                          โทร {stay.guest.phone} •{" "}
                          {stay.stayType === "MONTHLY"
                            ? "สัญญาเช่ารายเดือน"
                            : stay.stayType === "SHORT_TIME"
                              ? `พักชั่วคราว (${shortTimeHours} ชม.)`
                              : "พักรายวัน"}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-sky-100 text-sky-800">
                        {stay.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        เข้า: {new Date(stay.checkInDate).toLocaleDateString("th-TH")}{" "}
                        {stay.stayType === "SHORT_TIME" ? formatTimeHM(stay.checkInDate) : ""}
                      </div>
                      <div>
                        ออก: {new Date(stay.checkOutDate).toLocaleDateString("th-TH")}{" "}
                        {stay.stayType === "SHORT_TIME" ? formatTimeHM(stay.checkOutDate) : ""}
                      </div>
                      {stay.stayType === "SHORT_TIME" && (() => {
                        const alertInfo = getShortTimeAlert(stay.checkOutDate);
                        return (
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${alertInfo.cls}`}
                            >
                              <Clock className="w-3 h-3" /> {alertInfo.label}
                            </span>
                          </div>
                        );
                      })()}
                      <div>อัตรา: ฿{stay.rateAmount.toLocaleString()}</div>
                      <div>
                        ยอดค้าง Folio:{" "}
                        <span className="font-bold text-rose-600">
                          ฿{(stay.folio?.balance ?? 0).toLocaleString()}
                        </span>
                      </div>
                      {(stay.keyDeposit ?? 0) > 0 && (
                        <div className="col-span-2 pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                            ค่ามัดจำกุญแจ: ฿{(stay.keyDeposit ?? 0).toLocaleString()} (
                            {stay.keyDepositStatus === "RETURNED"
                              ? "คืนแล้ว"
                              : stay.keyDepositStatus === "FORFEITED"
                                ? `ยึด/คืน ฿${(stay.keyDepositRefunded ?? 0).toLocaleString()}`
                                : "เก็บไว้อยู่"}
                            )
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {stay.status === "RESERVED" && (
                        <>
                          <button
                            onClick={() => handleStayAction(stay.id, "CHECK_IN")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Check-in ทันที
                          </button>
                          <button
                            onClick={() => handleStayAction(stay.id, "CANCEL")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium"
                          >
                            ยกเลิกจอง
                          </button>
                        </>
                      )}

                      {stay.status === "CHECKED_IN" && (
                        <>
                          {stay.folio && stay.folio.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayStayId(payStayId === stay.id ? null : stay.id);
                                setPayAmount(stay.folio?.balance ?? 0);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> ชำระเงิน &amp; ออกบิล
                            </button>
                          )}
                          {stay.stayType === "SHORT_TIME" && (
                            <button
                              type="button"
                              onClick={() => {
                                setExtendStayId(extendStayId === stay.id ? null : stay.id);
                                setExtendCharge(100);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                            >
                              <Clock className="w-3.5 h-3.5" /> ต่อเวลา +1 ชม.
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={checkingOut}
                            onClick={() => startCheckOut(stay)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50"
                          >
                            {checkingOut ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Check-out...
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5" /> Check-out
                              </>
                            )}
                          </button>
                          {selectedRoom.status !== "VD" && selectedRoom.status !== "OOO" && (
                            <button
                              type="button"
                              disabled={sendingCleaning}
                              onClick={() => handleRequestCleaning(selectedRoom.id, selectedRoom.roomNumber)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold"
                            >
                              {sendingCleaning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ClipboardCheck className="w-3.5 h-3.5" />
                              )}
                              {sendingCleaning ? "กำลังแจ้ง..." : "ส่งทำความสะอาด"}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {extendStayId === stay.id && stay.stayType === "SHORT_TIME" && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-amber-900">ต่อเวลา +1 ชม.</span>
                        <label className="text-slate-600">ค่าบริการเพิ่ม (฿):</label>
                        <input
                          type="number"
                          min="0"
                          value={extendCharge}
                          onChange={(e) => setExtendCharge(Number(e.target.value))}
                          className="w-24 px-2 py-1 rounded border border-amber-300 bg-white text-right font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleExtendShortTime(stay.id)}
                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                          ยืนยันต่อเวลา
                        </button>
                      </div>
                    )}

                    {payStayId === stay.id && stay.folio && (
                      <form
                        onSubmit={(e) => handleQuickPayment(e, stay, selectedRoom.roomNumber)}
                        className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-950">
                            รับชำระเงินห้อง {selectedRoom.roomNumber}
                          </span>
                          <span className="text-sm font-extrabold text-rose-600">
                            ค้าง ฿{stay.folio.balance.toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { v: "CASH", l: "เงินสด" },
                            { v: "TRANSFER", l: "โอน / PromptPay" },
                          ].map((m) => (
                            <button
                              key={m.v}
                              type="button"
                              onClick={() => setPayMethod(m.v)}
                              className={`py-2.5 rounded-lg text-xs font-semibold border transition ${
                                payMethod === m.v
                                  ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                                  : "bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              {m.l}
                            </button>
                          ))}
                        </div>
                        <div className={`grid gap-2 ${payMethod !== "CASH" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-medium text-emerald-900">
                                ยอดรับชำระ (บาท)
                              </label>
                              {payAmount !== stay.folio.balance && (
                                <button
                                  type="button"
                                  onClick={() => setPayAmount(stay.folio?.balance ?? 0)}
                                  className="text-[11px] font-semibold text-emerald-700 hover:underline"
                                >
                                  เต็มจำนวน ฿{stay.folio.balance.toLocaleString()}
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              required
                              value={payAmount}
                              onChange={(e) => setPayAmount(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm text-right font-bold font-mono"
                            />
                          </div>
                          {payMethod !== "CASH" && (
                            <div>
                              <label className="block text-[11px] font-medium text-emerald-900 mb-1">
                                เลขอ้างอิงสลิป (ถ้ามี)
                              </label>
                              <input
                                value={payRef}
                                onChange={(e) => setPayRef(e.target.value)}
                                placeholder="เช่น 4 หลักท้ายสลิป"
                                className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm"
                              />
                            </div>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={isPaying}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              กำลังบันทึกชำระ &amp; ออกบิล...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              ยืนยันชำระ &amp; ออกบิล (฿{payAmount.toLocaleString()})
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {stay.status === "CHECKED_IN" && vcRooms.length > 0 && (
                      <div className="flex items-center gap-2 pt-2">
                        <select
                          value={moveTargetId}
                          onChange={(e) => setMoveTargetId(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          <option value="">-- ย้ายไปห้องว่าง --</option>
                          {vcRooms.map((vr) => (
                            <option key={vr.id} value={vr.id}>
                              ห้อง {vr.roomNumber} ({vr.roomType.name})
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!moveTargetId}
                          onClick={() => handleStayAction(stay.id, "ROOM_MOVE", moveTargetId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium disabled:opacity-50"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" /> ย้ายห้อง
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-sm text-slate-500">
                ยังไม่มีผู้เข้าพักหรือการจองในห้องนี้
              </div>
            )}

            {/* Room Status Notice for VD */}
            {selectedRoom.status === "VD" && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                ห้องนี้อยู่ระหว่าง <strong>รอแม่บ้านทำความสะอาด</strong> — เมื่อแม่บ้านกดเสร็จสิ้น สถานะจะเปลี่ยนเป็น <strong>ว่างพร้อมพัก</strong> อัตโนมัติ
              </div>
            )}

            {/* Room Actions */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {selectedRoom.status === "VC" && (
                  <button
                    onClick={() => openNewBookingForRoom(selectedRoom)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                  >
                    <CalendarPlus className="w-4 h-4" /> จองห้อง / Walk-in
                  </button>
                )}

                {selectedRoom.status !== "VD" &&
                  selectedRoom.status !== "OOO" &&
                  !selectedRoom.stays.some((s) => s.status === "CHECKED_IN") && (
                  <button
                    type="button"
                    disabled={sendingCleaning}
                    onClick={() => handleRequestCleaning(selectedRoom.id, selectedRoom.roomNumber)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold"
                  >
                    {sendingCleaning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ClipboardCheck className="w-4 h-4" />
                    )}
                    {sendingCleaning ? "กำลังแจ้ง..." : "ส่งทำความสะอาด"}
                  </button>
                )}

                {selectedRoom.status !== "OOO" && selectedRoom.status !== "OC" && (
                  <button
                    onClick={() => setShowMaintForm(!showMaintForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                  >
                    <Wrench className="w-4 h-4" /> แจ้งซ่อม / ปิดห้อง (OOO)
                  </button>
                )}

                {selectedRoom.status === "OOO" && (
                  <button
                    onClick={() => handleRoomStatus(selectedRoom.id, "VC")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" /> ซ่อมเสร็จแล้ว (เปิดขาย VC)
                  </button>
                )}
              </div>

              {showMaintForm && (
                <form
                  onSubmit={(e) => handleReportMaintenance(e, selectedRoom.id)}
                  className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex gap-2"
                >
                  <input
                    required
                    value={maintNote}
                    onChange={(e) => setMaintNote(e.target.value)}
                    placeholder="ระบุอาการเสีย (เช่น แอร์ไม่เย็น, น้ำรั่ว)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    ยืนยันแจ้งซ่อม
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Booking / Walk-in Modal */}
      {selectedRoom && showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateStay}
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                เปิดการเข้าพัก / จองห้อง {selectedRoom.roomNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setStayType("DAILY");
                  setRateAmount(selectedRoom.roomType.baseDailyRate);
                }}
                className={`flex-1 min-w-[100px] py-2 rounded-lg text-xs font-semibold border ${
                  stayType === "DAILY"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                พักรายวัน
              </button>
              {enableShortTime && (
                <button
                  type="button"
                  onClick={() => {
                    setStayType("SHORT_TIME");
                    setRateAmount(shortTimeRate);
                    setCheckInNow(true);
                  }}
                  className={`flex-1 min-w-[100px] py-2 rounded-lg text-xs font-semibold border ${
                    stayType === "SHORT_TIME"
                      ? "bg-sky-700 text-white border-sky-700"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  ชั่วคราว ({shortTimeHours} ชม.)
                </button>
              )}
              {enableMonthly && (
                <button
                  type="button"
                  onClick={() => {
                    setStayType("MONTHLY");
                    setRateAmount(selectedRoom.roomType.baseMonthlyRate);
                    setSecurityDeposit(selectedRoom.roomType.baseMonthlyRate);
                    const d = new Date(checkInDate);
                    d.setMonth(d.getMonth() + 1);
                    setCheckOutDate(d.toISOString().slice(0, 10));
                  }}
                  className={`flex-1 min-w-[100px] py-2 rounded-lg text-xs font-semibold border ${
                    stayType === "MONTHLY"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  เช่ารายเดือน
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ชื่อ-นามสกุลผู้เข้าพัก *
                </label>
                <input
                  required
                  value={guestName}
                  onFocus={() => setGuestSuggestField("name")}
                  onBlur={() => setTimeout(() => setGuestSuggestField(null), 150)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGuestName(val);
                    setGuestSuggestField("name");
                    const exact = guests.find(
                      (g) => g.fullName.trim().toLowerCase() === val.trim().toLowerCase()
                    );
                    if (exact) {
                      setSelectedGuestId(exact.id);
                      setGuestPhone(exact.phone);
                      setIdNumber(exact.idNumber || "");
                      setCollectNow(exact.tag === "CREDIT" ? false : checkInNow);
                    } else {
                      setSelectedGuestId(null);
                      if (checkInNow) setCollectNow(true);
                    }
                  }}
                  placeholder="เช่น สมหญิง รักดี (พิมพ์เพื่อค้นหาลูกค้าเดิม)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                {guestSuggestField === "name" && guestName.trim().length > 0 && (() => {
                  const q = guestName.trim().toLowerCase();
                  const matches = guests
                    .filter(
                      (g) =>
                        g.fullName.toLowerCase().includes(q) ||
                        g.phone.toLowerCase().includes(q)
                    )
                    .slice(0, 6);
                  if (matches.length === 0) return null;
                  return (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {matches.map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedGuestId(g.id);
                            setGuestName(g.fullName);
                            setGuestPhone(g.phone);
                            setIdNumber(g.idNumber || "");
                            setCollectNow(g.tag === "CREDIT" ? false : checkInNow);
                            setGuestSuggestField(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            {g.fullName}
                            {g.tag === "CREDIT" && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 font-bold">
                                เครดิต
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500 shrink-0">{g.phone}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  เบอร์โทรศัพท์ *
                </label>
                <input
                  required
                  value={guestPhone}
                  onFocus={() => setGuestSuggestField("phone")}
                  onBlur={() => setTimeout(() => setGuestSuggestField(null), 150)}
                  onChange={(e) => {
                    setGuestPhone(e.target.value);
                    setSelectedGuestId(null);
                    setGuestSuggestField("phone");
                  }}
                  placeholder="08x-xxx-xxxx"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                {guestSuggestField === "phone" && guestPhone.trim().length > 0 && (() => {
                  const q = guestPhone.trim().toLowerCase();
                  const matches = guests
                    .filter(
                      (g) =>
                        g.phone.toLowerCase().includes(q) ||
                        g.fullName.toLowerCase().includes(q)
                    )
                    .slice(0, 6);
                  if (matches.length === 0) return null;
                  return (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {matches.map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedGuestId(g.id);
                            setGuestName(g.fullName);
                            setGuestPhone(g.phone);
                            setIdNumber(g.idNumber || "");
                            setCollectNow(g.tag === "CREDIT" ? false : checkInNow);
                            setGuestSuggestField(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            {g.fullName}
                            {g.tag === "CREDIT" && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 font-bold">
                                เครดิต
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500 shrink-0">{g.phone}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  </label>
                  {stayType === "DAILY" && /^\d{13}$/.test(idNumber.trim()) && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ครบ 13 หลัก · ลด ฿50/คืน อัตโนมัติ
                    </span>
                  )}
                  {idNumber.trim().length > 0 && !/^\d{13}$/.test(idNumber.trim()) && (
                    <span className="text-[11px] font-medium text-amber-700">
                      กรอกให้ครบ 13 หลัก ({idNumber.trim().length}/13)
                    </span>
                  )}
                </div>
                <input
                  value={idNumber}
                  inputMode="numeric"
                  maxLength={13}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  placeholder="กรอกตัวเลข 13 หลัก (มีเลขครบ 13 หลักรับส่วนลด ฿50/คืน)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                />
              </div>
              {stayType === "SHORT_TIME" ? (
                <div className="sm:col-span-2 p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-600" /> รอบเวลาเข้า-ออก ({shortTimeHours} ชม.)
                  </span>
                  <span className="font-bold text-sky-800">
                    {formatTimeHM(new Date(nowMs))} →{" "}
                    {formatTimeHM(new Date(nowMs + shortTimeHours * 3600 * 1000))}
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">วันเช็กอิน</label>
                    <ThaiCalendarPicker
                      value={checkInDate}
                      onChange={(val) => {
                        if (val) setCheckInDate(val);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">วันเช็กเอาท์</label>
                    <ThaiCalendarPicker
                      value={checkOutDate}
                      onChange={(val) => {
                        if (val) setCheckOutDate(val);
                      }}
                      align="right"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ค่าห้อง (
                  {stayType === "MONTHLY"
                    ? "บาท/เดือน"
                    : stayType === "SHORT_TIME"
                      ? `บาท/${shortTimeHours} ชม.`
                      : "บาท/คืน"}
                  ) <span className="text-[10px] text-slate-400">· ราคาจากระบบ</span>
                </label>
                <input
                  type="number"
                  value={
                    stayType === "DAILY"
                      ? Math.max(
                          0,
                          selectedRoom.roomType.baseDailyRate -
                            (/^\d{13}$/.test(idNumber.trim()) ? 50 : 0)
                        )
                      : rateAmount
                  }
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-semibold text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ค่ามัดจำกุญแจ (บาท) <span className="text-[10px] text-slate-400">· ราคาจากระบบ</span>
                </label>
                <input
                  type="number"
                  value={keyDeposit}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-semibold text-sm cursor-not-allowed"
                />
              </div>
              {stayType === "MONTHLY" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    เงินประกันความเสียหาย (Security Deposit)
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={checkInNow}
                onChange={(e) => {
                  setCheckInNow(e.target.checked);
                  if (!e.target.checked) setCollectNow(false);
                }}
                className="rounded border-slate-300"
              />
              Check-in เข้าพักทันที (Walk-in)
            </label>

            {checkInNow && (() => {
              const nightsCount =
                stayType === "DAILY"
                  ? Math.max(
                      1,
                      Math.round(
                        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
                          86400000
                      )
                    )
                  : 1;
              const effectiveRate =
                stayType === "DAILY"
                  ? Math.max(
                      0,
                      selectedRoom.roomType.baseDailyRate -
                        (/^\d{13}$/.test(idNumber.trim()) ? 50 : 0)
                    )
                  : rateAmount;
              const roomTotal = effectiveRate * nightsCount;
              const dueTotal = Math.max(0, roomTotal + keyDeposit - depositAmount);
              const resolvedGuest =
                (selectedGuestId ? guests.find((g) => g.id === selectedGuestId) : null) ??
                (guestName.trim()
                  ? guests.find(
                      (g) => g.fullName.trim().toLowerCase() === guestName.trim().toLowerCase()
                    )
                  : null);
              const isCreditGuest = resolvedGuest?.tag === "CREDIT";
              const shouldCollect = !isCreditGuest;

              return (
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isCreditGuest
                      ? "bg-sky-50/80 border-sky-200"
                      : "bg-emerald-50/80 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isCreditGuest ? "text-sky-950" : "text-emerald-950"
                      }`}
                    >
                      {isCreditGuest
                        ? "ลูกค้าเครดิต (วางบิลอัตโนมัติ)"
                        : "รับชำระทันที"}
                    </span>
                    <span
                      className={`text-sm font-extrabold shrink-0 ${
                        isCreditGuest ? "text-sky-700" : "text-emerald-700"
                      }`}
                    >
                      ฿{dueTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className={`text-[11px] ${isCreditGuest ? "text-sky-800" : "text-emerald-800"}`}>
                    ค่าห้อง ฿{roomTotal.toLocaleString()} + ค่ามัดจำกุญแจ ฿
                    {keyDeposit.toLocaleString()}
                    {depositAmount > 0 ? ` - มัดจำ ฿${depositAmount.toLocaleString()}` : ""}
                  </div>
                  {shouldCollect && dueTotal > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { v: "CASH", l: "เงินสด" },
                          { v: "TRANSFER", l: "โอน / PromptPay" },
                        ].map((m) => (
                          <button
                            key={m.v}
                            type="button"
                            onClick={() => setCollectMethod(m.v as "CASH" | "TRANSFER" | "CREDIT_CARD")}
                            className={`py-2 rounded-lg text-xs font-semibold border transition ${
                              collectMethod === m.v
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-white text-slate-700 border-emerald-200"
                            }`}
                          >
                            {m.l}
                          </button>
                        ))}
                      </div>
                      {collectMethod !== "CASH" && (
                        <input
                          value={collectRef}
                          onChange={(e) => setCollectRef(e.target.value)}
                          placeholder="เลขอ้างอิงสลิป (ถ้ามี)"
                          className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {submitting
                  ? "กำลังบันทึก..."
                  : checkInNow &&
                      ((selectedGuestId ? guests.find((g) => g.id === selectedGuestId) : null) ??
                        (guestName.trim()
                          ? guests.find(
                              (g) =>
                                g.fullName.trim().toLowerCase() === guestName.trim().toLowerCase()
                            )
                          : null))?.tag !== "CREDIT"
                    ? "ยืนยันเปิดห้อง & รับเงิน"
                    : "ยืนยันการเข้าพัก"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>

      {/* Printable Quick Receipt Modal (ครึ่ง A4) */}
      {payReceipt && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 flex items-center justify-center p-4 print-overlay">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-3 print-half-a4 border border-slate-200">
            {/* Header: 2 Columns for Half-A4 */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 gap-4">
              <div className="flex items-start gap-3">
                <ResortLogo className="w-16 h-auto shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-slate-900 leading-tight">
                    {propertySetting?.hotelName || "TheRoom Resort ชุมแพ"}
                  </div>
                  {propertySetting?.address && propertySetting.address !== "-" && (
                    <div className="text-[10px] text-slate-600 leading-tight">
                      {propertySetting.address}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-2">
                    {propertySetting?.phone && propertySetting.phone !== "-" && (
                      <span>โทร: {propertySetting.phone}</span>
                    )}
                    {propertySetting?.taxId && propertySetting.taxId !== "-" && (
                      <span>เลขผู้เสียภาษี: {propertySetting.taxId}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-sm text-slate-900">ใบเสร็จรับเงิน</div>
                <div className="text-xs font-bold text-emerald-800">
                  ห้อง {payReceipt.roomNumber} ({payReceipt.bookingCode})
                </div>
                <div className="text-[10px] text-slate-500">{payReceipt.paidAt}</div>
              </div>
            </div>

            {/* Guest & Payment Info Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 p-2 rounded-lg">
              <div>
                <span className="text-slate-500">ผู้เข้าพัก:</span>{" "}
                <span className="font-bold text-slate-900">{payReceipt.guestName}</span>
                {payReceipt.guestTaxId && (
                  <span className="text-slate-500 text-[10px] block">
                    เลขผู้เสียภาษี: {payReceipt.guestTaxId}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500">ช่องทางชำระ:</span>{" "}
                <span className="font-bold text-slate-900">
                  {payReceipt.method}
                  {payReceipt.referenceNo ? ` (${payReceipt.referenceNo})` : ""}
                </span>
              </div>
            </div>

            {/* Items Table */}
            {payReceipt.items.length > 0 && (
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                      <th className="py-1 px-2 text-left">รายการ</th>
                      <th className="py-1 px-2 text-right w-24">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payReceipt.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1 px-2 text-slate-900">{item.description}</td>
                        <td className="py-1 px-2 text-right font-mono font-medium">
                          ฿{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals & Signatures */}
            <div className="grid grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div>
                  ยอดค้างคงเหลือ:{" "}
                  <span className="font-mono font-bold text-slate-800">
                    ฿{payReceipt.remainingBalance.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 text-[10px] text-slate-400">
                  * ขอบคุณที่ไว้วางใจใช้บริการ TheRoom Resort
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-b border-slate-900 py-1">
                  <span>ยอดรับชำระ</span>
                  <span className="font-mono text-base text-emerald-700">
                    ฿{payReceipt.amount.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 flex justify-end text-[10px] text-slate-600 text-center">
                  <div>
                    <div className="w-28 border-b border-slate-400 mb-1"></div>
                    <div>( ผู้รับเงิน / Cashier )</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tear-off Guide Line (For Full A4 Paper) */}
            <div className="hidden print:flex items-center gap-2 pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300 mt-2">
              <span>✂</span>
              <span className="flex-1 border-b border-dashed border-slate-300"></span>
              <span>รอยตัด / ฉีกครึ่งหน้า A4</span>
              <span className="flex-1 border-b border-dashed border-slate-300"></span>
            </div>

            {/* Screen Action Buttons */}
            <div className="no-print flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" /> พิมพ์บิลครึ่ง A4
              </button>
              <button
                type="button"
                onClick={() => setPayReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutStay && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          onClick={() => setCheckoutStay(null)}
        >
          <form
            onSubmit={confirmCheckOutWithRefund}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Check-out &amp; คืนเงินมัดจำกุญแจ</h3>
                <p className="text-xs text-slate-500">
                  {checkoutStay.bookingCode} • {checkoutStay.guest.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStay(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const kd = checkoutStay.keyDeposit ?? 0;
              const bal = checkoutStay.folio?.balance ?? 0;
              const isCreditUnpaid = bal >= kd && kd > 0;
              const afterDebt = Math.max(0, bal - refundAmount);

              return (
                <div className="p-5 space-y-4 text-sm">
                  {isCreditUnpaid ? (
                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-900">
                          บิลเครดิต / ค้างชำระ — รับคืนกุญแจเป็นลดหนี้
                        </span>
                        <span className="text-sm font-extrabold text-sky-800">
                          มัดจำ ฿{kd.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-sky-700">
                        ค้างชำระก่อนคืน ฿{bal.toLocaleString()} → หลังลดหนี้เหลือค้าง{" "}
                        <strong>฿{afterDebt.toLocaleString()}</strong> (ไม่หักเงินสดหน้าร้าน)
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-amber-800 font-medium">
                          ค่ามัดจำกุญแจที่เก็บไว้
                        </div>
                        <div className="text-[11px] text-amber-700">
                          รับมาทาง:{" "}
                          {checkoutStay.keyDepositMethod === "TRANSFER" ? "เงินโอน" : "เงินสด"}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-amber-900">
                        ฿{kd.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="refundMode"
                        checked={refundMode === "RETURN"}
                        onChange={() => {
                          setRefundMode("RETURN");
                          setRefundAmount(kd);
                        }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          {isCreditUnpaid
                            ? `รับคืนกุญแจ — ลดหนี้มัดจำกุญแจเต็มจำนวน (-฿${kd.toLocaleString()})`
                            : `คืนเงินมัดจำกุญแจเต็มจำนวน (฿${kd.toLocaleString()})`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          แขกคืนกุญแจครบและห้องพักเรียบร้อย
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="refundMode"
                        checked={refundMode === "FORFEIT"}
                        onChange={() => {
                          setRefundMode("FORFEIT");
                          setRefundAmount(0);
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-rose-700 text-xs">
                          หักค่าเสียหาย / ยึดมัดจำกุญแจ
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isCreditUnpaid
                            ? "ระบุยอดมัดจำกุญแจที่ลดหนี้ให้ (0 หากยึดทั้งหมดไว้ในบิล)"
                            : "ระบุยอดที่คืนให้ลูกค้าจริง (0 หากยึดทั้งหมด)"}
                        </div>
                      </div>
                    </label>
                  </div>

                  {refundMode === "FORFEIT" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {isCreditUnpaid
                          ? "ยอดมัดจำกุญแจที่ลดหนี้ให้ (บาท)"
                          : "ยอดเงินที่คืนลูกค้าจริง (บาท)"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={kd}
                        value={refundAmount}
                        onChange={(e) =>
                          setRefundAmount(Math.max(0, Math.min(kd, Number(e.target.value))))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                  )}

                  {!isCreditUnpaid && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ช่องทางคืนเงินมัดจำ
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value as "CASH" | "TRANSFER")}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="CASH">เงินสด</option>
                        <option value="TRANSFER">เงินโอน / PromptPay</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckoutStay(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={checkingOut}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                {checkingOut ? "กำลังบันทึก..." : "ยืนยัน Check-out & บันทึกคืนเงิน"}
              </button>
            </div>
          </form>
        </div>
      )}

      {cleaningToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl border border-emerald-500 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{cleaningToast}</span>
          <button
            type="button"
            onClick={() => setCleaningToast(null)}
            className="ml-1 p-0.5 rounded hover:bg-emerald-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
