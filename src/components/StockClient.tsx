"use client";

import { useMemo, useState } from "react";
import { ResortLogo } from "@/components/ResortLogo";
import {
  AlertTriangle,
  Boxes,
  Check,
  Edit3,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Tags,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import type { UnifiedStockItem, UnifiedUsageType } from "@/app/api/stock/route";

interface MenuCategoryOption {
  id: string;
  name: string;
  station: string;
}

interface StockCategoryOption {
  id: string;
  name: string;
}

const USAGE_LABELS: Record<UnifiedUsageType, string> = {
  SALE: "ขายหน้าร้าน (POS)",
  ISSUE: "เบิกใช้ภายใน",
  BOTH: "ทั้งขาย & เบิก",
};

const USAGE_BADGES: Record<UnifiedUsageType, string> = {
  SALE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ISSUE: "bg-amber-50 text-amber-700 border-amber-200",
  BOTH: "bg-sky-50 text-sky-700 border-sky-200",
};

export function StockClient({
  initialItems,
  menuCategories: initialMenuCategories,
  stockCategories: initialStockCategories,
  hotelName,
}: {
  initialItems: UnifiedStockItem[];
  menuCategories: MenuCategoryOption[];
  stockCategories: StockCategoryOption[];
  hotelName: string;
}) {
  const [items, setItems] = useState<UnifiedStockItem[]>(initialItems);
  const [menuCats, setMenuCats] = useState<MenuCategoryOption[]>(initialMenuCategories);
  const [supplyCats, setSupplyCats] = useState<StockCategoryOption[]>(initialStockCategories);
  const [filterType, setFilterType] = useState<"ALL" | UnifiedUsageType | "LOW">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Add / Edit Product Modal
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<UnifiedStockItem | null>(null);
  const [form, setForm] = useState({
    usageType: "SALE" as UnifiedUsageType,
    name: "",
    sku: "",
    barcode: "",
    cost: "0",
    price: "0",
    stockQty: "0",
    minStock: "5",
    trackStock: true,
    unit: "ชิ้น",
    menuCategoryId: initialMenuCategories[0]?.id ?? "",
    supplyCategory: initialStockCategories[0]?.name ?? "ของใช้ในห้องพัก",
    isMinibar: false,
  });

  // Category Management Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catTab, setCatTab] = useState<"MENU" | "SUPPLY">("MENU");
  const [newCatName, setNewCatName] = useState("");
  const [newCatStation, setNewCatStation] = useState("มินิบาร์ / หน้าร้าน");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingCatStation, setEditingCatStation] = useState("");
  const [catError, setCatError] = useState("");

  function formatStationLabel(station?: string) {
    if (!station) return "";
    if (station === "MINIBAR") return "มินิบาร์ / หน้าร้าน";
    if (station === "BAR") return "เครื่องดื่ม / บาร์";
    if (station === "KITCHEN") return "ครัว / อาหาร";
    return station;
  }

  // Quick Stock Count Modal
  const [adjustTarget, setAdjustTarget] = useState<UnifiedStockItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("0");

  // Printable Stock Check Sheet Modal
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [printFilter, setPrintFilter] = useState<"ALL" | "SALE_ONLY" | "ISSUE_ONLY">("ALL");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterType === "LOW") {
        if (!item.trackStock || item.stockQty > item.minStock) return false;
      } else if (filterType !== "ALL" && item.usageType !== filterType) {
        return false;
      }

      if (filterCategory.startsWith("MENU:")) {
        const targetId = filterCategory.slice(5);
        if (item.menuCategoryId !== targetId) return false;
      } else if (filterCategory.startsWith("SUPPLY:")) {
        const targetName = filterCategory.slice(7);
        if (item.supplyCategory !== targetName) return false;
      }

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        item.menuCategoryName.toLowerCase().includes(q) ||
        item.supplyCategory.toLowerCase().includes(q)
      );
    });
  }, [items, filterType, filterCategory, search]);

  const stats = useMemo(() => {
    const saleCount = items.filter((i) => i.usageType === "SALE" || i.usageType === "BOTH").length;
    const issueCount = items.filter((i) => i.usageType === "ISSUE" || i.usageType === "BOTH").length;
    const lowCount = items.filter((i) => i.trackStock && i.stockQty <= i.minStock).length;
    const totalCostValue = items.reduce(
      (sum, i) => sum + (i.trackStock ? i.cost * i.stockQty : 0),
      0
    );
    return { saleCount, issueCount, lowCount, totalCostValue };
  }, [items]);

  const printItems = useMemo(() => {
    return items.filter((i) => {
      if (printFilter === "SALE_ONLY") return i.usageType === "SALE" || i.usageType === "BOTH";
      if (printFilter === "ISSUE_ONLY") return i.usageType === "ISSUE" || i.usageType === "BOTH";
      return true;
    });
  }, [items, printFilter]);

  function syncPayload(data: {
    items?: UnifiedStockItem[];
    menuCategories?: MenuCategoryOption[];
    stockCategories?: StockCategoryOption[];
  }) {
    if (data.items) setItems(data.items);
    if (data.menuCategories) setMenuCats(data.menuCategories);
    if (data.stockCategories) setSupplyCats(data.stockCategories);
  }

  function openCreateModal() {
    setEditingItem(null);
    setForm({
      usageType: "SALE",
      name: "",
      sku: "",
      barcode: "",
      cost: "",
      price: "",
      stockQty: "0",
      minStock: "5",
      trackStock: true,
      unit: "ชิ้น",
      menuCategoryId: menuCats[0]?.id ?? "",
      supplyCategory: supplyCats[0]?.name ?? "ของใช้ในห้องพัก",
      isMinibar: false,
    });
    setShowForm(true);
  }

  function openEditModal(item: UnifiedStockItem) {
    setEditingItem(item);
    setForm({
      usageType: item.usageType,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      cost: String(item.cost),
      price: String(item.price),
      stockQty: String(item.stockQty),
      minStock: String(item.minStock),
      trackStock: item.trackStock,
      unit: item.unit || "ชิ้น",
      menuCategoryId: item.menuCategoryId || menuCats[0]?.id || "",
      supplyCategory: item.supplyCategory || supplyCats[0]?.name || "ของใช้ในห้องพัก",
      isMinibar: item.isMinibar,
    });
    setShowForm(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    const isEdit = Boolean(editingItem);
    const optimisticKey = editingItem?.key || `temp-${Date.now()}`;
    const optimisticItem: UnifiedStockItem = {
      key: optimisticKey,
      usageType: form.usageType,
      menuItemId: editingItem?.menuItemId ?? null,
      supplyItemId: editingItem?.supplyItemId ?? null,
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      cost: Number(form.cost || 0),
      price: Number(form.price || 0),
      stockQty: Number(form.stockQty || 0),
      minStock: Number(form.minStock || 5),
      trackStock: form.trackStock,
      unit: form.unit,
      menuCategoryId: form.menuCategoryId,
      menuCategoryName: menuCats.find((c) => c.id === form.menuCategoryId)?.name || "",
      supplyCategory: form.supplyCategory,
      isMinibar: form.isMinibar,
    };

    // Instant UI update (0ms feedback)
    if (isEdit) {
      setItems((prev) => prev.map((item) => (item.key === editingItem!.key ? optimisticItem : item)));
    } else {
      setItems((prev) => [optimisticItem, ...prev]);
    }
    setShowForm(false);

    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPSERT_PRODUCT",
          menuItemId: editingItem?.menuItemId ?? null,
          supplyItemId: editingItem?.supplyItemId ?? null,
          usageType: form.usageType,
          name: form.name,
          sku: form.sku,
          barcode: form.barcode,
          cost: Number(form.cost || 0),
          price: Number(form.price || 0),
          stockQty: Number(form.stockQty || 0),
          minStock: Number(form.minStock || 5),
          trackStock: form.trackStock,
          unit: form.unit,
          menuCategoryId: form.menuCategoryId,
          supplyCategory: form.supplyCategory,
          isMinibar: form.isMinibar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "บันทึกไม่สำเร็จ");
        setShowForm(true);
        return;
      }
      syncPayload(data);
    } catch {
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatError("");
    if (!newCatName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CATEGORY",
          categoryType: catTab,
          name: newCatName.trim(),
          station: newCatStation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCatError(data.error || "เพิ่มหมวดไม่สำเร็จ");
        return;
      }
      syncPayload(data);
      setNewCatName("");
    } finally {
      setLoading(false);
    }
  }

  async function handleRenameCategory(id: string) {
    if (!editingCatName.trim()) return;
    setCatError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RENAME_CATEGORY",
          categoryType: catTab,
          id,
          name: editingCatName.trim(),
          station: catTab === "MENU" ? editingCatStation.trim() || "มินิบาร์ / หน้าร้าน" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCatError(data.error || "แก้ไขชื่อหมวดไม่สำเร็จ");
        return;
      }
      syncPayload(data);
      setEditingCatId(null);
      setEditingCatName("");
      setEditingCatStation("");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`ลบหมวดสินค้า "${name}"?`)) return;
    setCatError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_CATEGORY",
          categoryType: catTab,
          id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCatError(data.error || "ลบหมวดไม่สำเร็จ");
        return;
      }
      syncPayload(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustTarget) return;
    const targetKey = adjustTarget.key;
    const newQty = Number(adjustQty || 0);

    // Instant UI update (0ms feedback)
    setItems((prev) =>
      prev.map((item) =>
        item.key === targetKey ? { ...item, stockQty: newQty } : item
      )
    );
    const savedTarget = adjustTarget;
    setAdjustTarget(null);

    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_STOCK",
          menuItemId: savedTarget.menuItemId,
          supplyItemId: savedTarget.supplyItemId,
          newStockQty: newQty,
        }),
      });
      const data = await res.json();
      if (res.ok && data.items) {
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: UnifiedStockItem) {
    if (!confirm(`ลบรายการ "${item.name}" ออกจากระบบ?`)) return;

    // Instant UI update (0ms feedback)
    setItems((prev) => prev.filter((i) => i.key !== item.key));

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DEACTIVATE",
          menuItemId: item.menuItemId,
          supplyItemId: item.supplyItemId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.items) setItems(data.items);
    } catch {
      // ignore
    }
  }

  const parsedCost = Number(form.cost || 0);
  const parsedPrice = Number(form.price || 0);
  const unitProfit = parsedPrice - parsedCost;

  return (
    <>
      <div className={`space-y-3 sm:space-y-6 ${showPrintSheet ? "no-print" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">คลังสินค้า &amp; สต๊อกรวม</h1>
            <p className="hidden sm:block text-sm text-slate-500">
              เพิ่มสินค้าจากเมนูเดียวกัน แยกประเภท ขาย (POS) / เบิกใช้ (Supplies) พร้อมราคาทุน และพิมพ์ใบตรวจนับสต๊อก
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setCatError("");
                setShowCatModal(true);
              }}
              title="จัดการหมวดสินค้า"
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50"
            >
              <Tags className="w-4 h-4" />
              <span className="sm:hidden">หมวด</span>
              <span className="hidden sm:inline">จัดการหมวดสินค้า</span>
            </button>
            <button
              onClick={() => setShowPrintSheet(true)}
              title="พิมพ์ใบตรวจนับสต๊อก"
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์ใบตรวจนับสต๊อก</span>
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-sky-600 text-white text-xs sm:text-sm font-medium hover:bg-sky-700"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:hidden">เพิ่มสินค้า</span>
              <span className="hidden sm:inline">เพิ่มสินค้า / ของใช้ใหม่</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-sky-600" /> รายการทั้งหมด
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ขาย {stats.saleCount} · เบิก {stats.issueCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> สินค้าขายหน้าร้าน (POS)
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.saleCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">พร้อมยิงบาร์โค้ดขาย</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" /> มูลค่าสต๊อก (ราคาทุน)
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ฿{stats.totalCostValue.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">คำนวณจาก ต้นทุน × คงเหลือ</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> สต็อกต่ำกว่าเกณฑ์
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.lowCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">รายการที่ต้องสั่งซื้อเพิ่ม</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["ALL", `ทั้งหมด (${items.length})`],
                ["SALE", "ขายหน้าร้าน (POS)"],
                ["ISSUE", "เบิกใช้ภายใน"],
                ["BOTH", "ทั้งขาย & เบิก"],
                ["LOW", `สต็อกต่ำ (${stats.lowCount})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  filterType === key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700"
            >
              <option value="ALL">ทุกหมวดสินค้า</option>
              {menuCats.length > 0 && (
                <optgroup label="หมวดสินค้าขาย (POS)">
                  {menuCats.map((c) => (
                    <option key={`MENU:${c.id}`} value={`MENU:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {supplyCats.length > 0 && (
                <optgroup label="หมวดของใช้ภายใน (เบิก)">
                  {supplyCats.map((c) => (
                    <option key={`SUPPLY:${c.name}`} value={`SUPPLY:${c.name}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัส, บาร์โค้ด, หมวด..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Unified Stock Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">รหัสสินค้า</th>
                  <th className="text-left px-4 py-3">บาร์โค้ด</th>
                  <th className="text-left px-4 py-3">ชื่อสินค้า / วัสดุ</th>
                  <th className="text-left px-4 py-3">ประเภทการใช้งาน</th>
                  <th className="text-left px-4 py-3">หมวดหมู่</th>
                  <th className="text-right px-4 py-3">ต้นทุน/หน่วย</th>
                  <th className="text-right px-4 py-3">ราคาขาย</th>
                  <th className="text-right px-4 py-3">กำไร/หน่วย</th>
                  <th className="text-right px-4 py-3">คงเหลือ</th>
                  <th className="text-right px-4 py-3">มูลค่าทุนรวม</th>
                  <th className="text-right px-4 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = item.trackStock && item.stockQty <= item.minStock;
                  const canSell = item.usageType === "SALE" || item.usageType === "BOTH";
                  const profit = canSell ? item.price - item.cost : 0;
                  const totalCost = item.trackStock ? item.cost * item.stockQty : 0;

                  return (
                    <tr key={item.key} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {item.sku || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {item.barcode || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            USAGE_BADGES[item.usageType]
                          }`}
                        >
                          {USAGE_LABELS[item.usageType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {[item.menuCategoryName, item.supplyCategory].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        ฿{item.cost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {canSell
                          ? `฿${item.price.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {canSell ? (
                          <span className={profit >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                            {profit >= 0 ? "+" : ""}฿{profit.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.trackStock ? (
                          <button
                            onClick={() => {
                              setAdjustTarget(item);
                              setAdjustQty(String(item.stockQty));
                            }}
                            title="คลิกเพื่อปรับยอดสต๊อก"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                              isLow
                                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                            }`}
                          >
                            {item.stockQty} {item.unit}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">ไม่นับสต๊อก</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                        {item.trackStock
                          ? `฿${totalCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                            title="แก้ไขสินค้า"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-sm">
                      ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Unified Add / Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? `แก้ไขสินค้า: ${editingItem.name}` : "เพิ่มสินค้า / ของใช้ใหม่"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Usage Type Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  ประเภทการใช้งาน (แยกขาย / เบิก) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["SALE", "ขายหน้าร้าน (POS)"],
                      ["ISSUE", "เบิกใช้ภายใน"],
                      ["BOTH", "ทั้งขาย & เบิก"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          usageType: val,
                          trackStock: val === "SALE" ? f.trackStock : true,
                        }))
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                        form.usageType === val
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600">ชื่อสินค้า / ของใช้ *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น น้ำดื่ม 600ml, สบู่ก้อน"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-600">รหัสสินค้า (SKU)</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="เช่น DRK-001, SUP-001"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-600">บาร์โค้ด (Barcode)</label>
                  <input
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="สแกนหรือกรอกเลขบาร์โค้ด"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* Cost & Price */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700">ต้นทุนต่อหน่วย (฿) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 bg-white rounded-xl text-sm font-semibold"
                  />
                </div>

                {(form.usageType === "SALE" || form.usageType === "BOTH") && (
                  <div>
                    <label className="text-xs font-semibold text-emerald-700">ราคาขาย (฿) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full mt-1 px-3 py-2 border border-emerald-300 bg-white rounded-xl text-sm font-semibold text-emerald-700"
                    />
                  </div>
                )}

                {(form.usageType === "SALE" || form.usageType === "BOTH") && (
                  <div className="col-span-2 text-xs text-slate-600 flex justify-between pt-1 border-t border-slate-200">
                    <span>กำไรต่อหน่วยโดยประมาณ:</span>
                    <span className={unitProfit >= 0 ? "font-bold text-emerald-700" : "font-bold text-rose-600"}>
                      {unitProfit >= 0 ? "+" : ""}฿{unitProfit.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-3">
                {(form.usageType === "SALE" || form.usageType === "BOTH") && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-600">หมวดหมู่ POS</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCatTab("MENU");
                          setCatError("");
                          setShowCatModal(true);
                        }}
                        className="text-[11px] text-sky-600 hover:underline font-medium"
                      >
                        + จัดการหมวด
                      </button>
                    </div>
                    <select
                      value={form.menuCategoryId}
                      onChange={(e) => setForm({ ...form, menuCategoryId: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      {menuCats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(form.usageType === "ISSUE" || form.usageType === "BOTH") && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-600">หมวดหมู่ของใช้</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCatTab("SUPPLY");
                          setCatError("");
                          setShowCatModal(true);
                        }}
                        className="text-[11px] text-sky-600 hover:underline font-medium"
                      >
                        + จัดการหมวด
                      </button>
                    </div>
                    <select
                      value={form.supplyCategory}
                      onChange={(e) => setForm({ ...form, supplyCategory: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      {supplyCats.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600">หน่วยนับ</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="ชิ้น / ขวด / ม้วน / กล่อง"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Stock & MinStock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">จำนวนคงเหลือในคลัง</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQty}
                    onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">แจ้งเตือนเมื่อเหลือต่ำกว่า</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {form.usageType === "SALE" && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.trackStock}
                    onChange={(e) => setForm({ ...form, trackStock: e.target.checked })}
                  />
                  ตัดสต๊อกอัตโนมัติเมื่อขายผ่าน POS
                </label>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกสินค้า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Count Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 no-print">
          <form onSubmit={handleAdjustStock} className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900">ปรับยอดสต๊อก: {adjustTarget.name}</h3>
            <div>
              <label className="text-xs text-slate-500">
                จำนวนที่นับได้จริง ({adjustTarget.unit}) — เดิม {adjustTarget.stockQty}
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-lg font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
              >
                บันทึกยอดใหม่
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Stock Check Sheet Modal */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 flex items-start justify-center p-4 overflow-y-auto print-overlay">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-xl my-4 print-a4">
            <div className="flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">เลือกรายการที่จะพิมพ์:</span>
                {(
                  [
                    ["ALL", "ทั้งหมด"],
                    ["SALE_ONLY", "เฉพาะสินค้าขาย (POS)"],
                    ["ISSUE_ONLY", "เฉพาะของใช้เบิก"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setPrintFilter(k)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      printFilter === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                >
                  <Printer className="w-4 h-4" /> สั่งพิมพ์ใบตรวจนับ
                </button>
                <button
                  onClick={() => setShowPrintSheet(false)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Content */}
            <div className="space-y-4 text-slate-900">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-start gap-3">
                  <ResortLogo className="w-24 h-auto shrink-0" />
                  <div>
                    <h2 className="text-lg font-bold">{hotelName}</h2>
                    <p className="text-sm font-semibold">ใบตรวจนับสินค้าและวัสดุคงคลัง (Stock Check Sheet)</p>
                    <p className="text-xs text-slate-500">
                      หมวด:{" "}
                      {printFilter === "ALL"
                        ? "สินค้าขายและของใช้เบิกทั้งหมด"
                        : printFilter === "SALE_ONLY"
                        ? "เฉพาะสินค้าขาย (POS)"
                        : "เฉพาะของใช้เบิก (Supplies)"}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>วันที่พิมพ์: {new Date().toLocaleString("th-TH")}</p>
                  <p>จำนวนรายการ: {printItems.length} รายการ</p>
                </div>
              </div>

              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-2 py-2 text-center w-10">#</th>
                    <th className="border border-slate-300 px-2 py-2 text-left">รหัสสินค้า</th>
                    <th className="border border-slate-300 px-2 py-2 text-left">บาร์โค้ด</th>
                    <th className="border border-slate-300 px-2 py-2 text-left">ชื่อสินค้า / วัสดุ</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">ประเภท</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">หน่วย</th>
                    <th className="border border-slate-300 px-2 py-2 text-right">ต้นทุน/หน่วย</th>
                    <th className="border border-slate-300 px-2 py-2 text-right">ยอดในระบบ</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-24">นับจริง</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-20">ผลต่าง</th>
                    <th className="border border-slate-300 px-2 py-2 text-left w-28">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {printItems.map((item, idx) => (
                    <tr key={item.key}>
                      <td className="border border-slate-300 px-2 py-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 px-2 py-2 font-mono">{item.sku || "-"}</td>
                      <td className="border border-slate-300 px-2 py-2 font-mono">{item.barcode || "-"}</td>
                      <td className="border border-slate-300 px-2 py-2 font-medium">{item.name}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        {item.usageType === "SALE" ? "ขาย" : item.usageType === "ISSUE" ? "เบิก" : "ขาย+เบิก"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{item.unit}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right">
                        ฿{item.cost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-right font-semibold">
                        {item.trackStock ? item.stockQty : "-"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2"></td>
                      <td className="border border-slate-300 px-2 py-2"></td>
                      <td className="border border-slate-300 px-2 py-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                <div className="space-y-6">
                  <p>ลงชื่อ .......................................................</p>
                  <p>( ผู้ตรวจนับสต๊อก )<br />วันที่ ........ / ........ / ............</p>
                </div>
                <div className="space-y-6">
                  <p>ลงชื่อ .......................................................</p>
                  <p>( ผู้ตรวจสอบ / หัวหน้าคลัง )<br />วันที่ ........ / ........ / ............</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tags className="w-5 h-5 text-sky-600" />
                จัดการหมวดสินค้า
              </h2>
              <button
                onClick={() => {
                  setShowCatModal(false);
                  setEditingCatId(null);
                  setCatError("");
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCatTab("MENU");
                  setEditingCatId(null);
                  setCatError("");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  catTab === "MENU"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                หมวดสินค้าขาย (POS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCatTab("SUPPLY");
                  setEditingCatId(null);
                  setCatError("");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  catTab === "SUPPLY"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                หมวดของใช้ภายใน (เบิก)
              </button>
            </div>

            {catError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {catError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={
                  catTab === "MENU"
                    ? "ชื่อหมวดสินค้าขายใหม่ เช่น ขนมขบเคี้ยว"
                    : "ชื่อหมวดของใช้ใหม่ เช่น เครื่องนอน"
                }
                className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <button
                type="submit"
                disabled={loading || !newCatName.trim()}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
              >
                + เพิ่มหมวด
              </button>
            </form>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {(catTab === "MENU" ? menuCats : supplyCats).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        placeholder="ชื่อหมวดสินค้า"
                        className="flex-1 min-w-0 px-2.5 py-1 border border-sky-300 rounded-lg text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        title="บันทึก"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(null);
                          setEditingCatName("");
                          setEditingCatStation("");
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                        title="ยกเลิก"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-slate-800 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditingCatName(cat.name);
                            setEditingCatStation(
                              catTab === "MENU" && "station" in cat && typeof cat.station === "string"
                                ? formatStationLabel(cat.station)
                                : ""
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                          title="แก้ไขหมวด"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="ลบหมวด"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {(catTab === "MENU" ? menuCats : supplyCats).length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  ยังไม่มีหมวดสินค้า
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
