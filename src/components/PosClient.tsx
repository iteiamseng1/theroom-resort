"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ResortLogo } from "@/components/ResortLogo";
import {
  Ban,
  Barcode,
  BedDouble,
  Check,
  CreditCard,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  Printer,
  ScanBarcode,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

interface MenuItem {
  id: string;
  categoryId: string;
  barcode: string;
  name: string;
  price: number;
  stockQty: number;
  trackStock: boolean;
  isMinibar: boolean;
}

interface Category {
  id: string;
  name: string;
  station: string;
  items: MenuItem[];
}

interface DiningTable {
  id: string;
  tableNumber: string;
  zone: string;
  status: string;
}

interface ActiveStay {
  id: string;
  bookingCode: string;
  room: { roomNumber: string };
  guest: { fullName: string };
}

interface PosOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  table: { tableNumber: string } | null;
  stay: { room: { roomNumber: string }; guest: { fullName: string } } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    menuItem: { name: string };
  }>;
}

interface ReceiptSlip {
  orderNumber: string;
  items: Array<{ name: string; qty: number; price: number }>;
  subtotal: number;
  vatAmt: number;
  total: number;
  paymentMethod: string;
  cashReceived: number;
  change: number;
  paidAt: string;
}

function playScanBeep(ok = true) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = ok ? 1400 : 320;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.07 : 0.18));
  } catch {
    // ignore audio errors
  }
}

export function PosClient({
  initialCategories,
  initialTables,
  initialStays,
  initialOrders,
  vatRate,
  serviceRate,
  userRole = "FRONT_DESK",
  propertySetting,
}: {
  initialCategories: Category[];
  initialTables: DiningTable[];
  initialStays: ActiveStay[];
  initialOrders: PosOrder[];
  vatRate: number;
  serviceRate: number;
  userRole?: string;
  propertySetting?: {
    hotelName: string;
    address: string;
    phone: string;
    taxId: string;
  };
}) {
  const [tab, setTab] = useState<"POS" | "STOCK" | "HISTORY">("POS");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [orders, setOrders] = useState<PosOrder[]>(initialOrders);

  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [stayId, setStayId] = useState<string>("");
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

  // 7-11 Barcode Scanner & Cash Drawer state
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanQuery, setScanQuery] = useState("");
  const [scanAlert, setScanAlert] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "PROMPTPAY" | "CREDIT_CARD">("CASH");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [lastReceipt, setLastReceipt] = useState<ReceiptSlip | null>(null);

  // Add Menu Item state
  const [newBarcode, setNewBarcode] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState(80);
  const [newCatId, setNewCatId] = useState(initialCategories[0]?.id ?? "");
  const [newTrackStock, setNewTrackStock] = useState(false);
  const [newStockQty, setNewStockQty] = useState(20);

  // Edit Menu Item state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Category Management state
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [catError, setCatError] = useState("");

  // Void Order Modal state
  const [voidOrderTarget, setVoidOrderTarget] = useState<PosOrder | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState("");

  useEffect(() => {
    if (tab === "POS") {
      scanInputRef.current?.focus();
    }
  }, [tab]);

  async function refreshAll() {
    const res = await fetch("/api/pos");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setOrders(data.orders);
    }
  }

  function addToCart(item: MenuItem) {
    setScanAlert("");
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [{ item, qty: 1 }, ...prev];
    });
  }

  function handleBarcodeScan(e: React.FormEvent) {
    e.preventDefault();
    const q = scanQuery.trim();
    if (!q) return;

    const flat = categories.flatMap((c) => c.items);
    const exactBarcode = flat.find((i) => i.barcode && i.barcode.toLowerCase() === q.toLowerCase());
    const matchedList = flat.filter(
      (i) =>
        i.name.toLowerCase().includes(q.toLowerCase()) ||
        (i.barcode && i.barcode.toLowerCase().includes(q.toLowerCase()))
    );

    const target = exactBarcode || (matchedList.length === 1 ? matchedList[0] : null);
    if (target) {
      addToCart(target);
      playScanBeep(true);
      setScanQuery("");
      setScanAlert(`+1 ${target.name} (฿${target.price})`);
    } else {
      playScanBeep(false);
      setScanAlert(`ไม่พบสินค้าบาร์โค้ด "${q}"`);
    }
    scanInputRef.current?.focus();
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  }

  function setCartQty(id: string, rawQty: number) {
    const qty = Math.max(1, Math.round(rawQty || 1));
    setCart((prev) =>
      prev.map((c) => (c.item.id === id ? { ...c, qty } : c))
    );
  }

  const subtotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  // Retail / POS prices are VAT-inclusive so grandTotal matches item prices
  const vatAmt =
    vatRate > 0 ? Number((subtotal - subtotal / (1 + vatRate / 100)).toFixed(2)) : 0;
  const grandTotal = Number(subtotal.toFixed(2));
  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);

  const cashNum = cashReceived ? Number(cashReceived) : grandTotal;
  const changeAmount = paymentMethod === "CASH" ? Math.max(0, Number((cashNum - grandTotal).toFixed(2))) : 0;

  async function submitOrder(settleNow: "PAY_DIRECT" | "CHARGE_TO_ROOM") {
    if (cart.length === 0 || submitting) return;
    if (settleNow === "CHARGE_TO_ROOM" && !stayId) {
      alert("กรุณาเลือกห้องพักที่ต้องการโยนยอดเข้าบิล");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ORDER",
          orderType: settleNow === "CHARGE_TO_ROOM" ? "MINIBAR" : "TAKEAWAY",
          stayId: settleNow === "CHARGE_TO_ROOM" ? stayId : undefined,
          items: cart.map((c) => ({ menuItemId: c.item.id, quantity: c.qty })),
          settleNow,
          paymentMethod: settleNow === "PAY_DIRECT" ? paymentMethod : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastReceipt({
          orderNumber: data.order.orderNumber,
          items: cart.map((c) => ({ name: c.item.name, qty: c.qty, price: c.item.price })),
          subtotal,
          vatAmt,
          total: grandTotal,
          paymentMethod: settleNow === "CHARGE_TO_ROOM" ? "โยนเข้าบิลห้องพัก" : paymentMethod,
          cashReceived: settleNow === "CHARGE_TO_ROOM" ? grandTotal : cashNum,
          change: settleNow === "CHARGE_TO_ROOM" ? 0 : changeAmount,
          paidAt: new Date().toLocaleString("th-TH"),
        });

        // Optimistically deduct stock in local state immediately
        const cartMap = new Map(cart.map((c) => [c.item.id, c.qty]));
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((item) => {
              const qty = cartMap.get(item.id);
              if (qty && item.trackStock) {
                return { ...item, stockQty: Math.max(0, item.stockQty - qty) };
              }
              return item;
            }),
          }))
        );

        setCart([]);
        setCashReceived("");
        setScanAlert("");
        void refreshAll();
        scanInputRef.current?.focus();
      } else {
        const err = await res.json();
        alert(err.error || "บันทึกออเดอร์ไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateKitchenStatus(orderId: string, status: string) {
    await fetch("/api/pos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    await refreshAll();
  }

  async function settleOpenOrder(orderId: string, settleType: "PAY_DIRECT" | "CHARGE_TO_ROOM") {
    const res = await fetch("/api/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SETTLE_ORDER",
        orderId,
        settleType,
        paymentMethod: "CASH",
        stayId: settleType === "CHARGE_TO_ROOM" ? stayId : undefined,
      }),
    });
    if (res.ok) {
      await refreshAll();
    } else {
      const err = await res.json();
      alert(err.error || "ชำระเงินไม่สำเร็จ");
    }
  }

  function canVoidOrder(order: PosOrder) {
    if (order.status === "CANCELLED") return false;
    return ["OWNER", "MANAGER", "ADMIN"].includes(userRole);
  }

  async function handleVoidOrder() {
    if (!voidOrderTarget) return;
    const reason = voidReason.trim();
    if (!reason) {
      setVoidError("กรุณาระบุเหตุผลในการยกเลิกบิล");
      return;
    }
    setVoidSubmitting(true);
    setVoidError("");
    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VOID_ORDER",
          orderId: voidOrderTarget.id,
          reason,
        }),
      });
      if (res.ok) {
        setVoidOrderTarget(null);
        setVoidReason("");
        await refreshAll();
      } else {
        const err = await res.json();
        setVoidError(err.error || "ยกเลิกบิลไม่สำเร็จ");
      }
    } catch {
      setVoidError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setVoidSubmitting(false);
    }
  }

  async function addMenuItem(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_MENU_ITEM",
        categoryId: newCatId,
        barcode: newBarcode,
        name: newName,
        price: newPrice,
        trackStock: newTrackStock,
        stockQty: newTrackStock ? newStockQty : 0,
        isMinibar: newTrackStock,
      }),
    });
    if (res.ok) {
      setNewBarcode("");
      setNewName("");
      await refreshAll();
    }
  }

  async function saveMenuItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    const res = await fetch("/api/pos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_MENU_ITEM",
        id: editingItem.id,
        categoryId: editingItem.categoryId,
        barcode: editingItem.barcode,
        name: editingItem.name,
        price: editingItem.price,
        trackStock: editingItem.trackStock,
        stockQty: editingItem.stockQty,
        isMinibar: editingItem.isMinibar,
      }),
    });
    if (res.ok) {
      setEditingItem(null);
      await refreshAll();
    }
  }

  async function deleteMenuItem(id: string) {
    const res = await fetch("/api/pos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_MENU_ITEM", id }),
    });
    if (res.ok) {
      await refreshAll();
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatError("");
    const res = await fetch("/api/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_CATEGORY",
        name: newCatName,
        station: "MINIBAR",
      }),
    });
    if (res.ok) {
      setNewCatName("");
      await refreshAll();
    }
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCat) return;
    setCatError("");
    const res = await fetch("/api/pos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_CATEGORY",
        id: editingCat.id,
        name: editingCat.name,
        station: "MINIBAR",
      }),
    });
    if (res.ok) {
      setEditingCat(null);
      await refreshAll();
    }
  }

  async function deleteCategory(id: string) {
    setCatError("");
    const res = await fetch("/api/pos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_CATEGORY", id }),
    });
    if (res.ok) {
      await refreshAll();
    } else {
      const data = await res.json();
      setCatError(data.error || "ลบหมวดหมู่ไม่สำเร็จ");
    }
  }

  const allItems = categories
    .flatMap((c) => (selectedCat === "ALL" || selectedCat === c.id ? c.items : []))
    .filter((i) => {
      if (!scanQuery.trim()) return true;
      const q = scanQuery.trim().toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        (i.barcode && i.barcode.toLowerCase().includes(q))
      );
    });

  const kitchenOrders = orders.filter((o) =>
    ["PENDING", "PREPARING", "SERVED"].includes(o.status)
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
            ขายPOS
          </h1>
          <p className="hidden sm:block text-sm text-slate-500">
                     </p>
        </div>

        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTab("POS")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              tab === "POS" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" /> ยิงขาย POS
          </button>
          <button
            onClick={() => setTab("HISTORY")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              tab === "HISTORY" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> ประวัติบิล ({orders.length})
          </button>
        </div>
      </div>

      {tab === "POS" && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left half: Scanner + Product Grid */}
          <div className="space-y-3">
            {/* 7-11 Barcode Scanner Bar */}
            <form onSubmit={handleBarcodeScan} className="relative">
              <ScanBarcode className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3" />
              <input
                ref={scanInputRef}
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder="ยิงบาร์โค้ด หรือพิมพ์ชื่อสินค้า... (กด Enter เพื่อยิงลงตะกร้า)"
                className="w-full pl-11 pr-24 py-2.5 rounded-xl border-2 border-emerald-500/70 bg-white text-sm font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
              />
              {scanQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setScanQuery("");
                    scanInputRef.current?.focus();
                  }}
                  className="absolute right-16 top-2.5 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
                >
                  ล้าง
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                ยิงขาย
              </button>
            </form>

            {scanAlert && (
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                {scanAlert}
              </div>
            )}

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCat("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  selectedCat === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    selectedCat === c.id
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    addToCart(item);
                    playScanBeep(true);
                    scanInputRef.current?.focus();
                  }}
                  className="bg-white hover:border-emerald-500 active:scale-[0.98] border border-slate-200 rounded-xl p-3 text-left transition shadow-xs flex flex-col justify-between min-h-[96px]"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900 line-clamp-2">
                      {item.name}
                    </div>
                    {item.barcode && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                        <Barcode className="w-3 h-3" /> {item.barcode}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-emerald-600 text-base">
                      ฿{item.price.toLocaleString()}
                    </span>
                    {item.trackStock && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          item.stockQty <= 10
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        เหลือ {item.stockQty}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right half: 7-11 Cash Register Receipt & Checkout */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                แคชเชียร์ ({totalUnits} ชิ้น)
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                >
                  ล้างตะกร้า
                </button>
              )}
            </div>

            {/* Walk-in Customer Only */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">ลูกค้า</span>
              <span className="font-semibold text-slate-800">ลูกค้าทั่วไป (Walk-in)</span>
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-slate-100 flex-1 min-h-[200px] overflow-y-auto bg-slate-50/60 rounded-xl px-3">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ยิงบาร์โค้ดหรือแตะสินค้าเพื่อเริ่มขาย
                </div>
              ) : (
                cart.map((c) => (
                  <div key={c.item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{c.item.name}</div>
                      <div className="text-slate-500">
                        ฿{c.item.price} × {c.qty} ={" "}
                        <span className="font-bold text-slate-800">
                          ฿{(c.item.price * c.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(c.item.id, -1)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={c.qty}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value, 10);
                          if (!Number.isNaN(val) && val >= 1) {
                            setCartQty(c.item.id, val);
                          }
                        }}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-12 text-center font-bold bg-white border border-slate-200 rounded-lg py-1 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => updateQty(c.item.id, 1)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateQty(c.item.id, -c.qty)}
                        className="p-1 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Grand Total Display (7-11 LCD style) */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-slate-300">ยอดสุทธิ</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  ฿{grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Method + Cash Change Calculator */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { k: "CASH", l: "เงินสด" },
                  { k: "PROMPTPAY", l: "PromptPay" },
                  { k: "CREDIT_CARD", l: "บัตรเครดิต" },
                ].map((m) => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setPaymentMethod(m.k as typeof paymentMethod)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border ${
                      paymentMethod === m.k
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {m.l}
                  </button>
                ))}
              </div>

              {paymentMethod === "CASH" && cart.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                      รับเงินมา:
                    </span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={String(grandTotal)}
                      className="flex-1 px-2.5 py-1 rounded-lg border border-slate-300 text-sm font-mono text-right bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(String(grandTotal))}
                      className="py-1.5 rounded-lg bg-slate-800 border border-slate-800 text-white text-[11px] font-bold hover:bg-slate-900 transition"
                    >
                      พอดี
                    </button>
                    {[
                      { bill: 20, cls: "bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100" },
                      { bill: 50, cls: "bg-sky-50 border-sky-400 text-sky-800 hover:bg-sky-100" },
                      { bill: 100, cls: "bg-rose-50 border-rose-400 text-rose-800 hover:bg-rose-100" },
                      { bill: 500, cls: "bg-purple-50 border-purple-400 text-purple-800 hover:bg-purple-100" },
                      { bill: 1000, cls: "bg-amber-100/80 border-amber-400 text-amber-900 hover:bg-amber-200/80" },
                    ].map(({ bill, cls }) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashReceived(String(bill))}
                        className={`py-1.5 rounded-lg border text-[11px] font-bold transition ${cls}`}
                      >
                        ฿{bill}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">เงินทอน</span>
                    <span className="text-lg font-extrabold text-emerald-600 font-mono">
                      ฿{changeAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={submitting || cart.length === 0}
                onClick={() => submitOrder("PAY_DIRECT")}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold shadow-sm disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังคิดเงิน &amp; ออกสลิป...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    คิดเงิน &amp; ออกสลิป (฿{grandTotal.toLocaleString()})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Half-A4 Receipt Modal (ใบเสร็จรับเงินอย่างย่อ ครึ่ง A4) */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 print-overlay">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-3 font-mono text-xs print-half-a4 border border-slate-200">
            {/* Header: 2 Columns for Half-A4 standard */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 gap-4">
              <div className="flex items-start gap-3">
                <ResortLogo className="w-16 h-auto shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-sans">
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
                <div className="font-bold text-sm text-slate-900 font-sans">
                  ใบเสร็จรับเงินอย่างย่อ
                </div>
                <div className="text-xs font-mono font-bold text-slate-800">
                  {lastReceipt.orderNumber}
                </div>
                <div className="text-[10px] text-slate-500">{lastReceipt.paidAt}</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 font-sans">
                    <th className="py-1 px-2 text-center w-8">#</th>
                    <th className="py-1 px-2 text-left">รายการสินค้า</th>
                    <th className="py-1 px-2 text-right w-16">จำนวน</th>
                    <th className="py-1 px-2 text-right w-20">ราคา/หน่วย</th>
                    <th className="py-1 px-2 text-right w-24">รวมเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lastReceipt.items.map((it, idx) => (
                    <tr key={idx} className="leading-tight">
                      <td className="py-1 px-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="py-1 px-2 font-sans font-medium text-slate-900">{it.name}</td>
                      <td className="py-1 px-2 text-right font-mono">{it.qty}</td>
                      <td className="py-1 px-2 text-right font-mono">฿{it.price.toLocaleString()}</td>
                      <td className="py-1 px-2 text-right font-mono font-semibold">
                        ฿{(it.price * it.qty).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1 text-slate-600 text-[11px] font-sans">
                <div>
                  ช่องทางชำระ: <span className="font-bold text-slate-800">{lastReceipt.paymentMethod}</span>
                </div>
                <div>
                  รับเงินมา: <span className="font-mono font-bold text-slate-800">฿{lastReceipt.cashReceived.toLocaleString()}</span>
                </div>
                {lastReceipt.paymentMethod === "CASH" && (
                  <div>
                    เงินทอน: <span className="font-mono font-bold text-emerald-700">฿{lastReceipt.change.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-1 text-[10px] text-slate-400">
                  * สินค้ารวมภาษีมูลค่าเพิ่มแล้ว (VAT Included)
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-b border-slate-900 py-1 font-sans">
                  <span>ยอดสุทธิ (Total)</span>
                  <span className="font-mono text-base text-emerald-700">
                    ฿{lastReceipt.total.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 flex justify-end text-[10px] text-slate-600 text-center font-sans">
                  <div>
                    <div className="w-28 border-b border-slate-400 mb-1"></div>
                    <div>( ผู้รับเงิน / Cashier )</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tear-off Guide Line (For Full A4 Paper) */}
            <div className="hidden print:flex items-center gap-2 pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300 mt-2 font-sans">
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> พิมพ์บิลครึ่ง A4
              </button>
              <button
                type="button"
                onClick={() => {
                  setLastReceipt(null);
                  scanInputRef.current?.focus();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-xs cursor-pointer"
              >
                ขายบิลถัดไป
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "HISTORY" && (
        <div className="no-print space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">
              ยังไม่มีประวัติบิลขาย POS
            </div>
          ) : (
            orders.map((o) => {
              const totalUnitsInOrder = o.items.reduce((s, it) => s + it.quantity, 0);
              const isVoided = o.status === "CANCELLED";
              const allowVoid = canVoidOrder(o);
              return (
                <div
                  key={o.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs space-y-2.5 ${
                    isVoided ? "border-rose-200 bg-rose-50/30 opacity-80" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg text-white ${
                          isVoided ? "bg-rose-600 line-through" : "bg-slate-900"
                        }`}
                      >
                        {o.orderNumber}
                      </span>
                      {isVoided ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          ยกเลิกแล้ว (VOID)
                        </span>
                      ) : o.status === "CHARGED_TO_ROOM" ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          โยนเข้าห้องพัก
                        </span>
                      ) : o.status === "PAID" ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ชำระแล้ว
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          รอชำระ
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {o.stay
                          ? `ห้อง ${o.stay.room.roomNumber} (${o.stay.guest.fullName})`
                          : "ลูกค้าทั่วไป"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(o.createdAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isVoided ? "text-rose-500 line-through" : "text-emerald-700"
                        }`}
                      >
                        รวม {totalUnitsInOrder} ชิ้น · ฿{o.totalAmount.toLocaleString()}
                      </span>
                      {!isVoided && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setLastReceipt({
                                orderNumber: o.orderNumber,
                                items: o.items.map((it) => ({
                                  name: it.menuItem.name,
                                  qty: it.quantity,
                                  price: it.unitPrice,
                                })),
                                subtotal: o.totalAmount,
                                vatAmt: 0,
                                total: o.totalAmount,
                                paymentMethod:
                                  o.status === "CHARGED_TO_ROOM" ? "โยนเข้าห้องพัก" : "เงินสด/โอน",
                                cashReceived: o.totalAmount,
                                change: 0,
                                paidAt: new Date(o.createdAt).toLocaleString("th-TH"),
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold"
                          >
                            <Printer className="w-3.5 h-3.5" /> พิมพ์สลิป
                          </button>
                          {allowVoid ? (
                            <button
                              type="button"
                              onClick={() => {
                                setVoidOrderTarget(o);
                                setVoidReason("");
                                setVoidError("");
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                            >
                              <Ban className="w-3.5 h-3.5" /> ยกเลิกบิล (Void)
                            </button>
                          ) : (
                            <span
                              title="เฉพาะ Admin / Manager เท่านั้นที่มีสิทธิ์ยกเลิกบิล"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-medium cursor-not-allowed"
                            >
                              ยกเลิกบิลติดต่อ Admin
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {o.notes && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 whitespace-pre-line">
                      {o.notes}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {o.items.map((it, idx) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {it.menuItem.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-slate-700">× {it.quantity}</span>
                          <span className="text-slate-500 font-mono w-16 text-right">
                            ฿{(it.quantity * it.unitPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "STOCK" && (
        <div className="no-print space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
            <span className="text-xs text-sky-900 font-medium">
              ต้องการเพิ่ม/แก้ไขสินค้าแบบรวม (แยกขาย/เบิก พร้อมต้นทุน) หรือพิมพ์ใบตรวจนับสต๊อก?
            </span>
            <Link
              href="/stock"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              ไปหน้าคลังสินค้า &amp; สต๊อกรวม
            </Link>
          </div>
          {/* Category Management */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="font-semibold text-sm text-slate-800">
              จัดการหมวดหมู่สินค้า ({categories.length} หมวด)
            </div>
            {catError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                {catError}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) =>
                editingCat?.id === c.id ? (
                  <form
                    key={c.id}
                    onSubmit={saveCategory}
                    className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-300 rounded-lg px-2 py-1"
                  >
                    <input
                      value={editingCat.name}
                      onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                      className="w-36 px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                      required
                    />
                    <button
                      type="submit"
                      className="p-1 rounded bg-emerald-600 text-white"
                      title="บันทึก"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      className="p-1 rounded border border-slate-300 bg-white text-slate-600"
                      title="ยกเลิก"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div
                    key={c.id}
                    className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => setEditingCat({ id: c.id, name: c.name })}
                      className="p-0.5 text-slate-500 hover:text-slate-800"
                      title="แก้ไขหมวดหมู่"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(c.id)}
                      className="p-0.5 text-rose-500 hover:text-rose-700"
                      title="ลบหมวดหมู่"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              )}
            </div>

            <form onSubmit={addCategory} className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <input
                required
                placeholder="ชื่อหมวดหมู่ใหม่ (เช่น ขนมขบเคี้ยว, เครื่องดื่ม, ของใช้)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
              >
                + เพิ่มหมวดหมู่
              </button>
            </form>
          </div>

          <form
            onSubmit={addMenuItem}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-6 gap-2.5"
          >
            <select
              value={newCatId}
              onChange={(e) => setNewCatId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="รหัสบาร์โค้ด (สแกนได้)"
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
            />
            <input
              required
              placeholder="ชื่อสินค้า / เมนู"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
            <input
              type="number"
              required
              placeholder="ราคาขาย (บาท)"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={newTrackStock}
                onChange={(e) => setNewTrackStock(e.target.checked)}
              />
              <span>ตัดสต็อก</span>
              {newTrackStock && (
                <input
                  type="number"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded border border-slate-300"
                />
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
            >
              + เพิ่มสินค้า
            </button>
          </form>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2.5">บาร์โค้ด</th>
                  <th className="px-4 py-2.5">รายการ</th>
                  <th className="px-4 py-2.5">หมวดหมู่</th>
                  <th className="px-4 py-2.5 text-right">ราคา (฿)</th>
                  <th className="px-4 py-2.5 text-right">สต็อกคงเหลือ</th>
                  <th className="px-4 py-2.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.flatMap((c) =>
                  c.items.map((item) =>
                    editingItem?.id === item.id ? (
                      <tr key={item.id} className="bg-sky-50/50">
                        <td className="px-4 py-2">
                          <input
                            value={editingItem.barcode}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, barcode: e.target.value })
                            }
                            placeholder="บาร์โค้ด"
                            className="w-28 px-2 py-1.5 rounded border border-slate-300 text-xs font-mono bg-white"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, name: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editingItem.categoryId}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, categoryId: e.target.value })
                            }
                            className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            value={editingItem.price}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, price: Number(e.target.value) })
                            }
                            className="w-24 px-2.5 py-1.5 rounded border border-slate-300 text-xs text-right bg-white"
                            required
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <input
                              type="checkbox"
                              checked={editingItem.trackStock}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, trackStock: e.target.checked })
                              }
                            />
                            {editingItem.trackStock && (
                              <input
                                type="number"
                                value={editingItem.stockQty}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    stockQty: Number(e.target.value),
                                  })
                                }
                                className="w-16 px-2 py-1 rounded border border-slate-300 text-xs text-right bg-white"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={saveMenuItem}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              title="บันทึก"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                              title="ยกเลิก"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                          {item.barcode || "-"}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{c.name}</td>
                        <td className="px-4 py-2.5 text-right">฿{item.price.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">
                          {item.trackStock ? (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                item.stockQty <= 10
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.stockQty}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">ไม่นับสต็อก</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                              title="แก้ไขเมนู"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMenuItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                              title="ลบเมนู"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการยกเลิกบิล (Void) */}
      {voidOrderTarget && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-600" />
                  ยกเลิกบิล POS (Void)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เลขที่บิล <span className="font-mono font-bold text-slate-800">{voidOrderTarget.orderNumber}</span> · ยอดรวม{" "}
                  <span className="font-bold text-rose-600">฿{voidOrderTarget.totalAmount.toLocaleString()}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVoidOrderTarget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">เมื่อยืนยันยกเลิก ระบบจะดำเนินการอัตโนมัติ:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>คืนสต็อกสินค้าทุกรายการที่นับสต็อกกลับเข้าคลัง</li>
                {voidOrderTarget.status === "CHARGED_TO_ROOM" ? (
                  <li>ถอนยอดค่าใช้จ่ายออกจากบิลห้องพัก ({voidOrderTarget.stay?.room.roomNumber ?? "-"})</li>
                ) : (
                  <li>ยกเลิกยอดรับเงินของบิลนี้ออกจากรายงานสรุปยอดขาย</li>
                )}
                <li>บันทึกประวัติผู้ยกเลิกและเหตุผลลงใน Audit Log</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                ระบุเหตุผลในการยกเลิกบิล <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "คีย์สินค้า/จำนวนผิด",
                  "ลงผิดห้องพัก",
                  "เลือกวิธีชำระผิด",
                  "ลูกค้าเปลี่ยนใจ/ยกเลิก",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVoidReason(preset)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                      voidReason === preset
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="พิมพ์เหตุผลการยกเลิกบิล..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {voidError && (
                <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {voidError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVoidOrderTarget(null)}
                disabled={voidSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleVoidOrder}
                disabled={voidSubmitting || !voidReason.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {voidSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                ยืนยันยกเลิกบิล (Void)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
