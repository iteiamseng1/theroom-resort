"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Plus, Printer, Receipt, Search } from "lucide-react";
import { ResortLogo } from "@/components/ResortLogo";

const CATEGORY_LABELS: Record<string, string> = {
  ROOM_CHARGE: "ค่าห้องพัก",
  KEY_DEPOSIT: "ค่ามัดจำกุญแจ",
  POS_FOOD: "มินิมาร์ท / POS",
  MINIBAR: "มินิบาร์",
  LAUNDRY: "ค่าซักรีด",
  PENALTY: "ค่าปรับ / ของเสียหาย",
  DEPOSIT: "มัดจำ",
  OTHER: "ค่าบริการอื่นๆ",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "เงินโอน",
  PROMPTPAY: "PromptPay",
  CREDIT_CARD: "บัตรเครดิต",
};

interface FolioRecord {
  id: string;
  status: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  stay: {
    bookingCode: string;
    stayType: string;
    keyDeposit?: number;
    keyDepositStatus?: string;
    keyDepositRefunded?: number;
    room: { roomNumber: string };
    guest: { fullName: string; phone: string; idNumber: string; address: string };
  };
  items: Array<{
    id: string;
    category: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    referenceNo: string;
    paidAt: string;
  }>;
}

interface HotelSetting {
  hotelName: string;
  taxId: string;
  address: string;
  phone: string;
}

export function BillingClient({
  initialFolios,
  setting,
  initialSelectedId,
}: {
  initialFolios: FolioRecord[];
  setting: HotelSetting;
  initialSelectedId?: string;
}) {
  const [folios, setFolios] = useState<FolioRecord[]>(initialFolios);
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedId || initialFolios[0]?.id || ""
  );

  // Charge form
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeCat, setChargeCat] = useState("OTHER");
  const [chargePrice, setChargePrice] = useState(100);
  const [applyTax, setApplyTax] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");

  const filteredFolios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return folios.filter((f) => {
      if (statusFilter === "UNPAID" && f.balance <= 0) return false;
      if (statusFilter === "PAID" && f.balance > 0) return false;
      if (!q) return true;
      return (
        f.stay.room.roomNumber.toLowerCase().includes(q) ||
        f.stay.guest.fullName.toLowerCase().includes(q) ||
        f.stay.bookingCode.toLowerCase().includes(q)
      );
    });
  }, [folios, searchQuery, statusFilter]);

  const selected = folios.find((f) => f.id === selectedId) || filteredFolios[0] || folios[0];

  async function refreshFolios() {
    const res = await fetch("/api/folios");
    if (res.ok) {
      const data = await res.json();
      setFolios(data.folios);
    }
  }

  async function handleAddCharge(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const res = await fetch("/api/folios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_CHARGE",
        folioId: selected.id,
        category: chargeCat,
        description: chargeDesc,
        quantity: 1,
        unitPrice: chargePrice,
        applyTax,
      }),
    });
    if (res.ok) {
      setChargeDesc("");
      await refreshFolios();
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || isSubmitting) return;
    const amt = payAmount > 0 ? payAmount : selected.balance;
    if (amt <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/folios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_PAYMENT",
          folioId: selected.id,
          amount: amt,
          method: payMethod,
          referenceNo: payRef,
          source: "FOLIO",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.folio) {
          setFolios((prev) =>
            prev.map((f) => (f.id === data.folio.id ? { ...f, ...data.folio } : f))
          );
        }
        setPayAmount(0);
        setPayRef("");
        void refreshFolios();
      } else {
        const err = await res.json();
        alert(err.error || "บันทึกชำระเงินไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="no-print flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">รับชำระ</h1>
          <p className="hidden sm:block text-sm text-slate-500">
            ตรวจสอบยอดค้างชำระ เพิ่มค่าใช้จ่าย รับชำระเงิน และพิมพ์ใบเสร็จ/ใบกำกับภาษี
          </p>
        </div>
        {selected && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            {selected.balance > 0 ? "พิมพ์ใบแจ้งหนี้" : "พิมพ์ใบเสร็จรับเงิน"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folio List */}
        <div className="no-print bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-800">
                รายการบิลห้องพัก ({filteredFolios.length})
              </span>
              <span className="text-[11px] font-semibold text-rose-600">
                ค้าง {folios.filter((f) => f.balance > 0).length} บิล
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาห้อง / ชื่อลูกค้า / เลขบิล..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["ALL", "ทั้งหมด"],
                  ["UNPAID", "ค้างชำระ"],
                  ["PAID", "จ่ายครบแล้ว"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatusFilter(k)}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition ${
                    statusFilter === k
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {filteredFolios.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">ไม่พบบิลที่ตรงกับเงื่อนไข</div>
            ) : (
              filteredFolios.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedId(f.id);
                    setPayAmount(Math.max(0, f.balance));
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${
                    selected?.id === f.id ? "bg-sky-50 border-l-4 border-sky-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      ห้อง {f.stay.room.roomNumber} • {f.stay.guest.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{f.stay.bookingCode}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          f.balance > 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {f.balance > 0 ? "ค้างชำระ" : "จ่ายครบ"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold ${
                        f.balance > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      ฿{f.balance.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">คงเหลือ</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Folio Detail + Printable Receipt */}
        <div className="lg:col-span-2 space-y-5">
          {selected ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
                {/* Print Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-start gap-3">
                    <ResortLogo className="w-24 h-auto shrink-0" />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{setting.hotelName}</h2>
                      <p className="text-xs text-slate-500">
                        {setting.address} {setting.phone ? `• โทร ${setting.phone}` : ""}
                      </p>
                      {setting.taxId && (
                        <p className="text-xs text-slate-500">
                          เลขประจำตัวผู้เสียภาษี: {setting.taxId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <Receipt
                        className={`w-4 h-4 ${
                          selected.balance > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}
                      />
                      {selected.balance > 0 ? "ใบแจ้งหนี้" : "ใบเสร็จรับเงิน"}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      ห้อง {selected.stay.room.roomNumber} ({selected.stay.bookingCode})
                    </div>
                    <div className="text-xs text-slate-600">
                      ผู้เข้าพัก: {selected.stay.guest.fullName}
                    </div>
                    {selected.stay.guest.idNumber && (
                      <div className="text-xs text-slate-600">
                        เลขประจำตัวผู้เสียภาษี:{" "}
                        <span className="font-mono">{selected.stay.guest.idNumber}</span>
                      </div>
                    )}
                    {(selected.stay.keyDeposit ?? 0) > 0 && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                        ค่ามัดจำกุญแจ: ฿{(selected.stay.keyDeposit ?? 0).toLocaleString()} (
                        {selected.stay.keyDepositStatus === "RETURNED"
                          ? "คืนแล้ว"
                          : selected.stay.keyDepositStatus === "FORFEITED"
                            ? `ยึด/คืน ฿${(selected.stay.keyDepositRefunded ?? 0).toLocaleString()}`
                            : "เก็บไว้อยู่"}
                        )
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500 text-left">
                        <th className="py-2">รายการ</th>
                        <th className="py-2 text-right">จำนวน</th>
                        <th className="py-2 text-right">ราคา/หน่วย</th>
                        <th className="py-2 text-right">รวม (฿)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 text-slate-800">
                            <div>{item.description}</div>
                            <div className="text-[10px] text-slate-400">
                              {CATEGORY_LABELS[item.category] ?? item.category}
                            </div>
                          </td>
                          <td className="py-2.5 text-right">{item.quantity}</td>
                          <td className="py-2.5 text-right">
                            {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right font-medium">
                            {item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>ยอดค่าใช้จ่ายรวม</span>
                    <span>฿{selected.totalCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>ชำระแล้วรวม</span>
                    <span>-฿{selected.totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-100">
                    <span>ยอดคงเหลือสุทธิ</span>
                    <span className={selected.balance > 0 ? "text-rose-600" : "text-emerald-600"}>
                      ฿{selected.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment History */}
                {selected.payments.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-2">ประวัติการรับชำระ</div>
                    <div className="space-y-1">
                      {selected.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between text-xs text-slate-600"
                        >
                          <span>
                            {PAYMENT_LABELS[p.method] ?? p.method}{" "}
                            {p.referenceNo ? `(${p.referenceNo})` : ""} •{" "}
                            {new Date(p.paidAt).toLocaleString("th-TH")}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            ฿{p.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Forms (Hidden on Print) */}
              <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.balance > 0 ? (
                  <form
                    onSubmit={handleRecordPayment}
                    className="bg-white rounded-xl border-2 border-emerald-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" /> รับชำระเงิน
                      </div>
                      <span className="text-xs font-bold text-rose-600">
                        ค้าง ฿{selected.balance.toLocaleString()}
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
                          className={`py-2 rounded-lg text-xs font-semibold border transition ${
                            payMethod === m.v
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
                          }`}
                        >
                          {m.l}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        placeholder={`ยอดชำระ (ค้าง ฿${selected.balance})`}
                        value={payAmount || ""}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-right font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setPayAmount(selected.balance)}
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap"
                      >
                        เต็มจำนวน
                      </button>
                    </div>
                    {payMethod !== "CASH" && (
                      <input
                        placeholder="เลขอ้างอิงสลิป / หมายเหตุ (ถ้ามี)"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังบันทึกรับชำระเงิน...
                        </>
                      ) : (
                        <>
                          บันทึกรับชำระเงิน (฿{(payAmount > 0 ? payAmount : selected.balance).toLocaleString()})
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-6 flex flex-col items-center justify-center text-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <div className="text-sm font-bold text-emerald-900">ชำระครบเรียบร้อยแล้ว</div>
                    <div className="text-xs text-emerald-700">สามารถกดพิมพ์ใบเสร็จได้ที่ปุ่มด้านบน</div>
                  </div>
                )}

                <form
                  onSubmit={handleAddCharge}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-sky-600" /> เพิ่มค่าใช้จ่ายเข้าห้อง
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { cat: "PENALTY", desc: "ค่าปรับ / ของเสียหาย", price: 200 },
                      { cat: "OTHER", desc: "ค่าต่อเวลา / ล่วงเวลา", price: 100 },
                      { cat: "LAUNDRY", desc: "ค่าซักรีด", price: 100 },
                      { cat: "OTHER", desc: "ค่าทำความสะอาดพิเศษ", price: 300 },
                    ].map((preset) => (
                      <button
                        key={preset.desc}
                        type="button"
                        onClick={() => {
                          setChargeCat(preset.cat);
                          setChargeDesc(preset.desc);
                          setChargePrice(preset.price);
                        }}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 text-[11px] font-medium transition"
                      >
                        + {preset.desc} (฿{preset.price})
                      </button>
                    ))}
                  </div>
                  <select
                    value={chargeCat}
                    onChange={(e) => setChargeCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="LAUNDRY">ค่าซักรีด</option>
                    <option value="PENALTY">ค่าปรับ / ของเสียหาย</option>
                    <option value="OTHER">ค่าบริการอื่นๆ (ส่วนกลาง/ที่จอดรถ)</option>
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      required
                      placeholder="รายละเอียดรายการ"
                      value={chargeDesc}
                      onChange={(e) => setChargeDesc(e.target.value)}
                      className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                    <input
                      type="number"
                      required
                      placeholder="บาท"
                      value={chargePrice}
                      onChange={(e) => setChargePrice(Number(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-right font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                    />
                    บวก VAT / Service Charge ตามตั้งค่า
                  </label>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                  >
                    เพิ่มรายการค่าใช้จ่าย
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
              ยังไม่มีรายการรับชำระ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
