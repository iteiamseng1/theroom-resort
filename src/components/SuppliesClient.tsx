"use client";

import { useMemo, useRef, useState } from "react";
import { ResortLogo } from "@/components/ResortLogo";
import {
  HistoryDateFilter,
  filterByThaiDate,
  getBangkokDateKey,
} from "@/components/HistoryDateFilter";
import { VoidConfirmModal } from "@/components/VoidConfirmModal";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Barcode,
  Check,
  History,
  LayoutGrid,
  Minus,
  PackagePlus,
  Pencil,
  Plus,
  Printer,
  ScanBarcode,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

interface SupplyItem {
  id: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  stockQty: number;
  minStock: number;
}

interface SupplyMovement {
  id: string;
  type: string;
  quantity: number;
  roomNumber: string;
  department: string;
  notes: string;
  userName: string;
  createdAt: string;
  supplyItem: { name: string; unit: string; cost?: number };
}

interface PrintBatchSlip {
  slipNo: string;
  type: "ISSUE" | "RESTOCK";
  department: string;
  roomNumber: string;
  notes: string;
  userName: string;
  createdAt: string;
  lines: Array<{ name: string; unit: string; quantity: number; cost: number }>;
}

export function SuppliesClient({
  initialItems,
  initialMovements,
  roomNumbers,
  canVoid = false,
}: {
  initialItems: SupplyItem[];
  initialMovements: SupplyMovement[];
  roomNumbers: string[];
  canVoid?: boolean;
}) {
  const [tab, setTab] = useState<"POS" | "HISTORY">("POS");
  const [items, setItems] = useState<SupplyItem[]>(initialItems);
  const [movements, setMovements] = useState<SupplyMovement[]>(initialMovements);
  const [errorMsg, setErrorMsg] = useState("");

  // POS-style Left Grid Filters
  const [searchInput, setSearchInput] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const searchRef = useRef<HTMLInputElement>(null);

  // POS-style Right Cart
  const [cart, setCart] = useState<Array<{ item: SupplyItem; qty: number }>>([]);
  const [department, setDepartment] = useState("แม่บ้าน");
  const [roomNumber, setRoomNumber] = useState("");
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Printable Slip Modal
  const [printSlip, setPrintSlip] = useState<PrintBatchSlip | null>(null);
  const [historyDate, setHistoryDate] = useState(() => getBangkokDateKey());
  const [voidSlipTarget, setVoidSlipTarget] = useState<(PrintBatchSlip & { totalQty: number; movementIds: string[] }) | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState("");

  // Group movements by slip number (only ISSUE / เบิกใช้)
  const groupedSlips = useMemo(() => {
    const map = new Map<string, PrintBatchSlip & { totalQty: number; movementIds: string[] }>();

    for (const m of movements) {
      if (m.type !== "ISSUE") continue;
      const slipMatch =
        m.notes.match(/\[([A-Z]{3}-?\d{6}-\d{3,})\]/) ||
        m.notes.match(/\[(\d{6}-\d{3,})\]/) ||
        m.notes.match(/ใบรับ\s+([A-Z]{3}-?\d{6}-\d{3,}|\d{6}-\d{3,})/) ||
        m.notes.match(/\[([A-Z]+-\d+)\]/);
      const slipNo = slipMatch?.[1] ?? m.id.slice(-8).toUpperCase();
      const cleanNotes = m.notes
        .replace(/\[[A-Z]{3}-?\d{6}-\d{3,}\]\s*/g, "")
        .replace(/\[\d{6}-\d{3,}\]\s*/g, "")
        .replace(/\[[A-Z]+-\d+\]\s*/g, "")
        .trim();

      const existing = map.get(slipNo);
      const line = {
        name: m.supplyItem.name,
        unit: m.supplyItem.unit,
        quantity: m.quantity,
        cost: m.supplyItem.cost ?? 0,
      };

      if (existing) {
        existing.lines.push(line);
        existing.totalQty += m.quantity;
        existing.movementIds.push(m.id);
      } else {
        map.set(slipNo, {
          slipNo,
          type: m.type === "ISSUE" ? "ISSUE" : "RESTOCK",
          department: m.department,
          roomNumber: m.roomNumber,
          notes: cleanNotes,
          userName: m.userName,
          createdAt: m.createdAt,
          lines: [line],
          totalQty: m.quantity,
          movementIds: [m.id],
        });
      }
    }

    return Array.from(map.values());
  }, [movements]);

  const filteredSlips = useMemo(
    () => filterByThaiDate(groupedSlips, (s) => s.createdAt, historyDate),
    [groupedSlips, historyDate]
  );

  // New / Edit Item in HISTORY tab
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("ของใช้ในห้องพัก");
  const [newUnit, setNewUnit] = useState("ชิ้น");
  const [newCost, setNewCost] = useState(0);
  const [newStock, setNewStock] = useState(50);
  const [newMin, setNewMin] = useState(10);
  const [editing, setEditing] = useState<SupplyItem | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return items.filter((i) => {
      if (selectedCat !== "ALL" && i.category !== selectedCat) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.barcode || "").toLowerCase().includes(q)
      );
    });
  }, [items, selectedCat, searchInput]);

  async function refresh() {
    const res = await fetch("/api/supplies");
    const data = await res.json();
    setItems(data.items);
    setMovements(data.movements);
  }

  function addToCart(item: SupplyItem) {
    setErrorMsg("");
    if (item.stockQty <= 0) {
      setErrorMsg(`${item.name} หมดสต็อก`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.qty + 1 > item.stockQty) {
          setErrorMsg(`${item.name} คงเหลือเพียง ${item.stockQty} ${item.unit}`);
          return prev;
        }
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function setCartQty(itemId: string, rawQty: number) {
    setErrorMsg("");
    const parsed = Math.max(1, Math.round(rawQty || 1));
    setCart((prev) =>
      prev.map((c) => {
        if (c.item.id !== itemId) return c;
        if (parsed > c.item.stockQty) {
          setErrorMsg(`${c.item.name} คงเหลือเพียง ${c.item.stockQty} ${c.item.unit}`);
          return { ...c, qty: c.item.stockQty };
        }
        return { ...c, qty: parsed };
      })
    );
  }

  function updateCartQty(itemId: string, delta: number) {
    setErrorMsg("");
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id !== itemId) return c;
          const next = c.qty + delta;
          if (next > c.item.stockQty) {
            setErrorMsg(`${c.item.name} คงเหลือเพียง ${c.item.stockQty} ${c.item.unit}`);
            return c;
          }
          return { ...c, qty: next };
        })
        .filter((c) => c.qty > 0)
    );
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim().toLowerCase();
    if (!q) return;
    const exact = items.find((i) => (i.barcode || "").toLowerCase() === q);
    const match = exact ?? filteredItems[0];
    if (match) {
      addToCart(match);
      setSearchInput("");
      searchRef.current?.focus();
    } else {
      setErrorMsg(`ไม่พบสินค้า "${searchInput}"`);
    }
  }

  const totalPieces = cart.reduce((s, c) => s + c.qty, 0);
  const totalCostValue = cart.reduce((s, c) => s + c.qty * (c.item.cost ?? 0), 0);

  async function submitIssueCart() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BATCH_MOVEMENT",
          type: "ISSUE",
          department,
          roomNumber,
          notes,
          lines: cart.map((c) => ({ supplyItemId: c.item.id, quantity: c.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "เบิกของไม่สำเร็จ");
        return;
      }

      const slip: PrintBatchSlip = {
        slipNo: data.slipNo,
        type: "ISSUE",
        department,
        roomNumber,
        notes,
        userName: data.movements?.[0]?.userName || "เจ้าหน้าที่",
        createdAt: new Date().toISOString(),
        lines: cart.map((c) => ({
          name: c.item.name,
          unit: c.item.unit,
          quantity: c.qty,
          cost: c.item.cost ?? 0,
        })),
      };

      setCart([]);
      setNotes("");
      setRoomNumber("");
      await refresh();
      setPrintSlip(slip);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/supplies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_ITEM",
        name: newName,
        category: newCat,
        unit: newUnit,
        cost: newCost,
        stockQty: newStock,
        minStock: newMin,
      }),
    });
    if (res.ok) {
      setNewName("");
      setShowAdd(false);
      await refresh();
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch("/api/supplies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await refresh();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/supplies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await refresh();
  }

  const lowStockCount = items.filter((i) => i.stockQty <= i.minStock).length;

  return (
    <>
      <div className={`space-y-5 ${printSlip ? "no-print" : ""}`}>
        {/* Header + POS-style Tabs */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">เบิกของใช้</h1>
            <p className="hidden sm:block text-sm text-slate-500">
              เลือกของใช้ลงตะกร้า และพิมพ์ใบเบิก
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
                <ShoppingBag className="w-3.5 h-3.5" /> เบิกของใช้
              </button>
              <button
                onClick={() => setTab("HISTORY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  tab === "HISTORY" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                <History className="w-3.5 h-3.5" /> ประวัติ ({groupedSlips.length})
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
            {/* Left half: Barcode Scanner + Category Pills + Clickable Cards */}
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ยิงบาร์โค้ด หรือพิมพ์ชื่อของใช้... (กด Enter เพื่อเพิ่มลงรายการเบิก)"
                  className="flex-1 text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  เพิ่มลงใบเบิก
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCat("ALL")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                    selectedCat === "ALL"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  ทั้งหมด ({items.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                      selectedCat === cat
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const isLow = item.stockQty <= item.minStock;
                  const out = item.stockQty <= 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={out}
                      onClick={() => addToCart(item)}
                      className={`text-left p-4 rounded-xl border transition shadow-xs ${
                        out
                          ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm"
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900 line-clamp-2">
                        {item.name}
                      </div>
                      {(item.barcode || item.sku) && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                          <Barcode className="w-3 h-3 shrink-0" /> {item.barcode || item.sku}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-semibold text-slate-700">
                          ทุน ฿{(item.cost ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isLow
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          เหลือ {item.stockQty} {item.unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right half: Requisition Cart (POS style) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <ArrowUpFromLine className="w-4 h-4 text-rose-600" /> รายการเบิก ({totalPieces} ชิ้น)
                </h2>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    ล้างรายการ
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500">แผนกที่เบิก</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="แม่บ้าน">แม่บ้าน</option>
                    <option value="หน้าฟรอนต์">หน้าฟรอนต์</option>
                    <option value="ห้องอาหาร/ครัว">ห้องอาหาร/ครัว</option>
                    <option value="ช่างซ่อมบำรุง">ช่างซ่อมบำรุง</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="text-[11px] font-medium text-slate-500">ห้องพัก (ถ้ามี)</label>
                  <button
                    type="button"
                    onClick={() => setShowRoomPicker((v) => !v)}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs text-left flex items-center justify-between gap-2"
                  >
                    <span className={roomNumber ? "font-semibold text-slate-900" : "text-slate-600"}>
                      {roomNumber ? `ห้อง ${roomNumber}` : "- ส่วนกลาง -"}
                    </span>
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {showRoomPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowRoomPicker(false)}
                      />
                      <div className="absolute right-0 mt-1.5 z-40 w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-2.5 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRoomNumber("");
                            setShowRoomPicker(false);
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                            roomNumber === ""
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          - ส่วนกลาง -
                        </button>
                        <div className="grid grid-cols-4 gap-1.5">
                          {roomNumbers.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setRoomNumber(r);
                                setShowRoomPicker(false);
                              }}
                              className={`py-2 rounded-lg text-xs font-bold border transition ${
                                roomNumber === r
                                  ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                                  : "bg-white hover:bg-sky-50 text-slate-800 border-slate-200"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-slate-100 flex-1 min-h-[220px] overflow-y-auto border-t border-b border-slate-100 py-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    ยิงบาร์โค้ดหรือแตะที่ของใช้เพื่อเพิ่มรายการเบิก
                  </p>
                ) : (
                  cart.map((c) => (
                    <div key={c.item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">{c.item.name}</div>
                        <div className="text-[11px] text-slate-400">
                          ทุน ฿{c.item.cost ?? 0} × {c.qty} {c.item.unit} = ฿
                          {((c.item.cost ?? 0) * c.qty).toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.item.id, -1)}
                          className="p-1 rounded border border-slate-200 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={c.item.stockQty}
                          value={c.qty}
                          onChange={(e) => {
                            const val = Number.parseInt(e.target.value, 10);
                            if (!Number.isNaN(val) && val >= 1) {
                              setCartQty(c.item.id, val);
                            }
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          className="w-12 text-center font-bold bg-white border border-slate-200 rounded py-0.5 text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.item.id, 1)}
                          className="p-1 rounded border border-slate-200 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.item.id, -c.qty)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* LCD Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">รวมเบิกทั้งหมด</div>
                  <div className="text-sm font-bold">{totalPieces} ชิ้น ({cart.length} รายการ)</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">มูลค่าต้นทุน</div>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    ฿{totalCostValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="หมายเหตุ (ถ้ามี)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />

              <button
                type="button"
                disabled={cart.length === 0 || submitting}
                onClick={submitIssueCart}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {submitting ? "กำลังบันทึก..." : "ยืนยันเบิกของใช้ & พิมพ์ใบเบิก"}
              </button>
            </div>
          </div>
        )}

        {tab === "HISTORY" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-sm text-slate-800">
                ประวัติการเบิกของใช้ (แยกตามเลขที่ใบเบิก {filteredSlips.length} ใบ)
              </h2>
              <HistoryDateFilter
                selectedDate={historyDate}
                onChange={setHistoryDate}
                count={filteredSlips.length}
                unitLabel="ใบ"
              />
            </div>

            {filteredSlips.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
                {groupedSlips.length === 0
                  ? "ยังไม่มีประวัติการเบิก-รับของใช้"
                  : "ไม่พบรายการในวันที่เลือก"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSlips.map((slip) => (
                  <div
                    key={slip.slipNo}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                  >
                    {/* Slip Header */}
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        {slip.type === "ISSUE" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                            เบิกใช้
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            รับเข้า
                          </span>
                        )}
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {slip.slipNo}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700">
                          {slip.department}
                          {slip.roomNumber ? ` (ห้อง ${slip.roomNumber})` : ""}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          {new Date(slip.createdAt).toLocaleString("th-TH")}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">โดย {slip.userName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 no-print">
                        <span className="text-xs font-semibold text-slate-600">
                          รวม {slip.lines.length} รายการ ({slip.totalQty} ชิ้น)
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrintSlip(slip)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> พิมพ์ใบเบิก
                        </button>
                        {canVoid && (
                          <button
                            type="button"
                            onClick={() => {
                              setVoidSlipTarget(slip);
                              setVoidReason("");
                              setVoidError("");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                          >
                            <Ban className="w-3.5 h-3.5" /> ยกเลิกใบเบิก
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slip Items List (1, 2, 3...) */}
                    <div className="p-4">
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                        {slip.lines.map((line, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50/50 text-xs"
                          >
                            <span className="font-medium text-slate-800">
                              {idx + 1}. {line.name}
                            </span>
                            <span className="font-bold text-slate-900 whitespace-nowrap">
                              {line.quantity} {line.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      {slip.notes && (
                        <div className="mt-2.5 text-[11px] text-slate-500">
                          หมายเหตุ: {slip.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printable Requisition / Restock Document Modal (ครึ่ง A4) */}
      {printSlip && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 flex items-center justify-center p-4 print-overlay">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-3 shadow-2xl print-half-a4 border border-slate-200">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 gap-4">
              <div className="flex items-start gap-2.5">
                <ResortLogo className="w-16 h-auto shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {printSlip.type === "ISSUE"
                      ? "ใบเบิกของใช้ภายในโรงแรม"
                      : "ใบรับของเข้าคลังวัสดุ"}
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    เลขที่เอกสาร: {printSlip.slipNo} · วันที่{" "}
                    {new Date(printSlip.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintSlip(null)}
                className="no-print text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg">
              <div>
                <span className="text-slate-400">แผนก:</span>{" "}
                <span className="font-semibold text-slate-900">{printSlip.department}</span>
              </div>
              <div>
                <span className="text-slate-400">ห้องพัก:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {printSlip.roomNumber ? `ห้อง ${printSlip.roomNumber}` : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">ผู้ทำรายการ:</span>{" "}
                <span className="font-semibold text-slate-900">{printSlip.userName}</span>
              </div>
              <div>
                <span className="text-slate-400">หมายเหตุ:</span>{" "}
                <span className="font-semibold text-slate-900">{printSlip.notes || "-"}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                    <th className="py-1 px-2 text-center w-8">#</th>
                    <th className="py-1 px-2 text-left">รายการ</th>
                    <th className="py-1 px-2 text-right w-20">จำนวน</th>
                    <th className="py-1 px-2 text-right w-24">ทุน/หน่วย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printSlip.lines.map((l, idx) => (
                    <tr key={idx} className="leading-tight">
                      <td className="py-1 px-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-1 px-2 font-medium text-slate-900">{l.name}</td>
                      <td className="py-1 px-2 text-right font-bold text-slate-800">
                        {l.quantity} {l.unit}
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-slate-600">
                        ฿{l.cost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 text-xs text-slate-600">
              <div className="text-center">
                <div className="border-b border-dashed border-slate-400 h-6 mb-1" />
                <span className="text-[11px]">ผู้เบิก / ผู้รับของ ({printSlip.userName})</span>
              </div>
              <div className="text-center">
                <div className="border-b border-dashed border-slate-400 h-6 mb-1" />
                <span className="text-[11px]">ผู้อนุมัติ / หัวหน้าคลัง</span>
              </div>
            </div>

            {/* Tear-off Guide Line (For Full A4 Paper) */}
            <div className="hidden print:flex items-center gap-2 pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300 mt-2">
              <span>✂</span>
              <span className="flex-1 border-b border-dashed border-slate-300"></span>
              <span>รอยตัด / ฉีกครึ่งหน้า A4</span>
              <span className="flex-1 border-b border-dashed border-slate-300"></span>
            </div>

            <div className="no-print flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> พิมพ์บิลครึ่ง A4
              </button>
              <button
                type="button"
                onClick={() => setPrintSlip(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      <VoidConfirmModal
        open={Boolean(voidSlipTarget)}
        title="ยกเลิกใบเบิกของใช้ (Void)"
        subtitle={
          voidSlipTarget
            ? `เลขที่ใบเบิก ${voidSlipTarget.slipNo} · รวม ${voidSlipTarget.totalQty} ชิ้น`
            : ""
        }
        effects={[
          "คืนสต็อกของใช้ทุกรายการในใบเบิกกลับเข้าคลังอัตโนมัติ",
          "ลบใบเบิกนี้ออกจากประวัติการเบิก",
          "บันทึกประวัติผู้ยกเลิกและเหตุผลลงใน Audit Log",
        ]}
        presets={[
          "คีย์รายการ/จำนวนผิด",
          "เบิกผิดห้อง/ผิดแผนก",
          "ไม่ได้นำไปใช้งานจริง",
        ]}
        reason={voidReason}
        onReasonChange={setVoidReason}
        error={voidError}
        submitting={voidSubmitting}
        onClose={() => setVoidSlipTarget(null)}
        onConfirm={async () => {
          if (!voidSlipTarget) return;
          const reason = voidReason.trim();
          if (!reason) {
            setVoidError("กรุณาระบุเหตุผลในการยกเลิกใบเบิก");
            return;
          }
          setVoidSubmitting(true);
          setVoidError("");
          try {
            const res = await fetch("/api/supplies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "VOID_SLIP",
                slipNo: voidSlipTarget.slipNo,
                movementIds: voidSlipTarget.movementIds,
                reason,
              }),
            });
            if (res.ok) {
              setVoidSlipTarget(null);
              setVoidReason("");
              await refresh();
            } else {
              const err = await res.json();
              setVoidError(err.error || "ยกเลิกใบเบิกไม่สำเร็จ");
            }
          } catch {
            setVoidError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
          } finally {
            setVoidSubmitting(false);
          }
        }}
      />
    </>
  );
}
