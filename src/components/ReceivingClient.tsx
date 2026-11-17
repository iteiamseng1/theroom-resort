"use client";

import { useMemo, useRef, useState } from "react";
import { ResortLogo } from "@/components/ResortLogo";
import {
  ArrowDownToLine,
  Barcode,
  History,
  Minus,
  Plus,
  Printer,
  ScanBarcode,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import type {
  ReceivingHistoryRecord,
  UnifiedStockItem,
  UnifiedUsageType,
} from "@/app/api/stock/route";

interface ReceivingLine {
  key: string;
  menuItemId: string | null;
  supplyItemId: string | null;
  name: string;
  barcode: string;
  unit: string;
  usageType: UnifiedUsageType;
  currentStock: number;
  oldCost: number;
  quantity: number;
  unitCost: number;
}

const USAGE_LABEL: Record<UnifiedUsageType, string> = {
  SALE: "ขาย (POS)",
  ISSUE: "เบิกใช้",
  BOTH: "ขาย + เบิก",
};

const USAGE_BADGE: Record<UnifiedUsageType, string> = {
  SALE: "bg-emerald-50 text-emerald-700",
  ISSUE: "bg-amber-50 text-amber-700",
  BOTH: "bg-sky-50 text-sky-700",
};

export function ReceivingClient({
  initialItems,
  initialHistory,
  hotelName,
}: {
  initialItems: UnifiedStockItem[];
  initialHistory: ReceivingHistoryRecord[];
  hotelName: string;
}) {
  const [tab, setTab] = useState<"POS" | "HISTORY">("POS");
  const [items, setItems] = useState<UnifiedStockItem[]>(initialItems);
  const [history, setHistory] = useState<ReceivingHistoryRecord[]>(initialHistory);

  const [search, setSearch] = useState("");
  const [filterUsage, setFilterUsage] = useState<"ALL" | UnifiedUsageType>("ALL");
  const searchRef = useRef<HTMLInputElement>(null);

  const [lines, setLines] = useState<ReceivingLine[]>([]);
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [printReceipt, setPrintReceipt] = useState<ReceivingHistoryRecord | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (filterUsage !== "ALL" && i.usageType !== filterUsage) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.barcode.toLowerCase().includes(q) ||
        i.menuCategoryName.toLowerCase().includes(q) ||
        i.supplyCategory.toLowerCase().includes(q)
      );
    });
  }, [items, filterUsage, search]);

  function addItemToCart(item: UnifiedStockItem) {
    setErrorMsg("");
    setLines((prev) => {
      const existing = prev.find((l) => l.key === item.key);
      if (existing) {
        return prev.map((l) =>
          l.key === item.key ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          key: item.key,
          menuItemId: item.menuItemId,
          supplyItemId: item.supplyItemId,
          name: item.name,
          barcode: item.barcode,
          unit: item.unit,
          usageType: item.usageType,
          currentStock: item.stockQty,
          oldCost: item.cost,
          quantity: 1,
          unitCost: item.cost,
        },
      ];
    });
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const exact = items.find((i) => i.barcode.toLowerCase() === q);
    const match = exact ?? filteredItems[0];
    if (match) {
      addItemToCart(match);
      setSearch("");
      searchRef.current?.focus();
    } else {
      setErrorMsg(`ไม่พบสินค้า "${search}"`);
    }
  }

  function updateLineQty(key: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function updateLineCost(key: string, unitCost: number) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, unitCost: Math.max(0, unitCost) } : l))
    );
  }

  const totalPieces = lines.reduce((sum, l) => sum + l.quantity, 0);
  const draftTotalCost = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  async function submitReceiving() {
    if (lines.length === 0) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECEIVE_STOCK",
          supplier,
          notes,
          lines: lines.map((l) => ({
            menuItemId: l.menuItemId,
            supplyItemId: l.supplyItemId,
            name: l.name,
            barcode: l.barcode,
            unit: l.unit,
            usageType: l.usageType,
            quantity: l.quantity,
            unitCost: l.unitCost,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setItems(data.items);
      setHistory(data.history);
      setLines([]);
      setSupplier("");
      setNotes("");
      if (data.receipt) setPrintReceipt(data.receipt);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={`space-y-5 ${printReceipt ? "no-print" : ""}`}>
        {/* Header + POS-style Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">รับของเข้าคลัง</h1>
            <p className="hidden sm:block text-sm text-slate-500">
              เลือกสินค้า ปรับต้นทุนใหม่ แล้วกดรับเข้า ระบบอัปเดตทุน
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setTab("POS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  tab === "POS" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" /> รับของเข้าคลัง
              </button>
              <button
                onClick={() => setTab("HISTORY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  tab === "HISTORY" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                <History className="w-3.5 h-3.5" /> ประวัติใบรับ ({history.length})
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {tab === "POS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left half: Barcode Scanner + Usage Filter + Clickable Product Cards */}
            <div className="space-y-4">
              <form
                onSubmit={handleBarcodeSubmit}
                className="flex gap-2 bg-white p-2.5 rounded-2xl border-2 border-emerald-500 shadow-xs"
              >
                <div className="flex items-center pl-2 text-emerald-600">
                  <ScanBarcode className="w-5 h-5" />
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ยิงบาร์โค้ด หรือพิมพ์ชื่อสินค้า... (กด Enter เพื่อเพิ่มลงใบรับของ)"
                  className="flex-1 text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  เพิ่มลงใบรับ
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ALL", `ทั้งหมด (${items.length})`],
                    ["SALE", "ขายหน้าร้าน (POS)"],
                    ["ISSUE", "เบิกใช้ภายใน"],
                    ["BOTH", "ทั้งขาย & เบิก"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setFilterUsage(k)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                      filterUsage === k
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => addItemToCart(item)}
                    className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 line-clamp-2">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          USAGE_BADGE[item.usageType]
                        }`}
                      >
                        {USAGE_LABEL[item.usageType]}
                      </span>
                    </div>
                    {item.barcode && (
                      <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                        <Barcode className="w-3 h-3 shrink-0" /> {item.barcode}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-bold text-slate-800">
                        ทุน ฿{item.cost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        เหลือ {item.stockQty} {item.unit}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right half: Receiving Cart (POS style) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                  ใบรับของเข้า ({totalPieces} ชิ้น)
                </h2>
                {lines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLines([])}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    ล้างรายการ
                  </button>
                )}
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-slate-100 flex-1 min-h-[220px] overflow-y-auto border-t border-b border-slate-100 py-1">
                {lines.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    ยิงบาร์โค้ดหรือแตะที่สินค้าเพื่อรับเข้าคลัง
                  </p>
                ) : (
                  lines.map((l) => (
                    <div key={l.key} className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 truncate">{l.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {USAGE_LABEL[l.usageType]} · เดิม {l.currentStock} {l.unit} (ทุนเดิม ฿{l.oldCost})
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLineQty(l.key, -1)}
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => {
                              const val = Number.parseInt(e.target.value, 10);
                              if (!Number.isNaN(val) && val >= 1) {
                                setLines((prev) =>
                                  prev.map((x) =>
                                    x.key === l.key ? { ...x, quantity: val } : x
                                  )
                                );
                              }
                            }}
                            onFocus={(e) => e.currentTarget.select()}
                            className="w-14 text-center font-bold bg-white border border-slate-200 rounded py-0.5 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateLineQty(l.key, 1)}
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLineQty(l.key, -l.quantity)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pl-1">
                        <label className="text-[11px] text-emerald-700 font-medium">
                          ต้นทุนใหม่/หน่วย (฿):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.unitCost}
                            onChange={(e) => updateLineCost(l.key, Number(e.target.value || 0))}
                            className="w-24 px-2 py-1 border border-emerald-300 rounded-lg text-right font-bold text-emerald-700 bg-emerald-50/40"
                          />
                          <span className="w-20 text-right font-semibold text-slate-800">
                            = ฿{(l.quantity * l.unitCost).toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* LCD Total Cost Display */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">รับเข้าทั้งหมด</div>
                  <div className="text-sm font-bold">{totalPieces} ชิ้น ({lines.length} รายการ)</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">ยอดรับเข้าสุทธิ</div>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    ฿{draftTotalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="ซัพพลายเออร์ / ร้านค้า"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เลขที่บิล / หมายเหตุ"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <button
                type="button"
                disabled={lines.length === 0 || submitting}
                onClick={submitReceiving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {submitting ? "กำลังบันทึก..." : "ยืนยันรับของเข้า & อัปเดตต้นทุน"}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                อัปเดตสต๊อกและราคาต้นทุนในสินค้าทันที
              </p>
            </div>
          </div>
        )}

        {tab === "HISTORY" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-slate-800">
                ประวัติใบรับของเข้าคลัง (แยกตามเลขที่ใบรับ {history.length} ใบ)
              </h2>
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
                ยังไม่มีประวัติการรับของเข้าคลัง
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((rec) => {
                  const totalQty = rec.lines.reduce((sum, l) => sum + l.quantity, 0);
                  return (
                    <div
                      key={rec.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                    >
                      {/* Receipt Header */}
                      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            รับเข้า
                          </span>
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {rec.receiptNo}
                          </span>
                          {rec.supplier && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-medium text-slate-700">{rec.supplier}</span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">
                            {new Date(rec.createdAt).toLocaleString("th-TH")}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">โดย {rec.userName}</span>
                        </div>

                        <div className="flex items-center gap-3 no-print">
                          <span className="text-xs font-semibold text-slate-600">
                            รวม {rec.lines.length} รายการ ({totalQty} ชิ้น)
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            ฿{rec.totalCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPrintReceipt(rec)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" /> พิมพ์ใบรับ
                          </button>
                        </div>
                      </div>

                      {/* Receipt Items List (1, 2, 3...) */}
                      <div className="p-4">
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                          {rec.lines.map((line, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50/50 text-xs"
                            >
                              <span className="font-medium text-slate-800">
                                {idx + 1}. {line.name}
                              </span>
                              <div className="flex items-center gap-3 whitespace-nowrap">
                                <span className="text-slate-500">
                                  ฿{line.unitCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })} × {line.quantity} {line.unit}
                                </span>
                                <span className="font-bold text-slate-900">
                                  ฿{line.lineTotal.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {rec.notes && (
                          <div className="mt-2.5 text-[11px] text-slate-500">
                            หมายเหตุ: {rec.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printable Goods Receipt Modal (ครึ่ง A4) */}
      {printReceipt && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 flex items-start justify-center p-4 overflow-y-auto print-overlay">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-3 shadow-xl my-4 print-half-a4 border border-slate-200">
            <div className="flex items-center justify-between no-print border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-800">ใบรับของเข้าคลัง (Goods Receipt)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> สั่งพิมพ์บิลครึ่ง A4
                </button>
                <button
                  type="button"
                  onClick={() => setPrintReceipt(null)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-slate-900">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
                <div className="flex items-start gap-2.5">
                  <ResortLogo className="w-16 h-auto shrink-0" />
                  <div>
                    <h2 className="text-base font-bold leading-tight">{hotelName}</h2>
                    <p className="text-xs font-semibold text-slate-700">ใบรับสินค้าเข้าคลัง / อัปเดตต้นทุน</p>
                    <p className="text-[10px] text-slate-500">
                      ซัพพลายเออร์: {printReceipt.supplier || "-"}
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <p className="font-mono font-bold text-slate-800">เลขที่: {printReceipt.receiptNo}</p>
                  <p className="text-slate-500">วันที่: {new Date(printReceipt.createdAt).toLocaleString("th-TH")}</p>
                  <p className="text-slate-500">ผู้รับเข้า: {printReceipt.userName}</p>
                </div>
              </div>

              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-[11px]">
                    <th className="border border-slate-300 px-1.5 py-1 text-center w-8">#</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-left">รายการสินค้า</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-center w-16">ประเภท</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-right w-16">จำนวน</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-right w-20">ต้นทุน/หน่วย</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-right w-24">รวมเป็นเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {printReceipt.lines.map((l, idx) => (
                    <tr key={idx} className="leading-tight">
                      <td className="border border-slate-300 px-1.5 py-1 text-center text-slate-500">{idx + 1}</td>
                      <td className="border border-slate-300 px-1.5 py-1 font-medium">{l.name}</td>
                      <td className="border border-slate-300 px-1.5 py-1 text-center text-[10px]">
                        {USAGE_LABEL[l.usageType]}
                      </td>
                      <td className="border border-slate-300 px-1.5 py-1 text-right font-mono">
                        {l.quantity} {l.unit}
                      </td>
                      <td className="border border-slate-300 px-1.5 py-1 text-right font-mono">
                        ฿{l.unitCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-slate-300 px-1.5 py-1 text-right font-mono font-semibold">
                        ฿{l.lineTotal.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={5} className="border border-slate-300 px-1.5 py-1 text-right">
                      ยอดรับเข้าคลังรวมทั้งสิ้น
                    </td>
                    <td className="border border-slate-300 px-1.5 py-1 text-right font-mono font-bold text-emerald-800">
                      ฿{printReceipt.totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {printReceipt.notes && (
                <p className="text-[10px] text-slate-500">หมายเหตุ: {printReceipt.notes}</p>
              )}

              <div className="grid grid-cols-2 gap-8 pt-4 text-xs text-center">
                <div className="space-y-3">
                  <p>ลงชื่อ .......................................................</p>
                  <p className="text-[11px] text-slate-500">( ผู้ส่งมอบสินค้า )</p>
                </div>
                <div className="space-y-3">
                  <p>ลงชื่อ .......................................................</p>
                  <p className="text-[11px] text-slate-500">( ผู้ตรวจรับ / ผู้บันทึก )</p>
                </div>
              </div>

              {/* Tear-off Guide Line (For Full A4 Paper) */}
              <div className="hidden print:flex items-center gap-2 pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300 mt-2">
                <span>✂</span>
                <span className="flex-1 border-b border-dashed border-slate-300"></span>
                <span>รอยตัด / ฉีกครึ่งหน้า A4</span>
                <span className="flex-1 border-b border-dashed border-slate-300"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
