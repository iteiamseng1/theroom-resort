"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, BedDouble, PackageCheck, Receipt, ShoppingBag } from "lucide-react";

interface UnpaidFolioItem {
  id: string;
  balance: number;
  bookingCode: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
}

interface PosSummaryItem {
  name: string;
  qty: number;
  total: number;
}

interface SupplyIssueItem {
  name: string;
  unit: string;
  qty: number;
}

interface LowStockMenuItem {
  id: string;
  name: string;
  stockQty: number;
}

interface LowStockSupplyItem {
  id: string;
  name: string;
  stockQty: number;
  unit: string;
}

interface ReportsInsightsTabsProps {
  openFolios: UnpaidFolioItem[];
  stayStats: {
    stayCount: number;
    stdStayCount: number;
    vipStayCount: number;
    dailyStayCount: number;
    shortTimeStayCount: number;
    monthlyStayCount: number;
    totalRooms: number;
    vacantCleanRooms: number;
    occupiedRooms: number;
    dirtyRooms: number;
    oooRooms: number;
  };
  posItemSummary: PosSummaryItem[];
  supplyIssueSummary: SupplyIssueItem[];
  lowStockMenus: LowStockMenuItem[];
  lowSupplies: LowStockSupplyItem[];
}

type InsightTab = "UNPAID" | "ROOMS" | "POS" | "STOCK";

export function ReportsInsightsTabs({
  openFolios,
  stayStats,
  posItemSummary,
  supplyIssueSummary,
  lowStockMenus,
  lowSupplies,
}: ReportsInsightsTabsProps) {
  const [activeTab, setActiveTab] = useState<InsightTab>("UNPAID");
  const lowStockCount = lowStockMenus.length + lowSupplies.length;

  const tabs: {
    key: InsightTab;
    label: string;
    badge?: number;
    alert?: boolean;
    activeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: "UNPAID",
      label: "ค้างชำระ",
      badge: openFolios.length,
      alert: openFolios.length > 0,
      activeClass: "bg-rose-600 text-white shadow-xs",
      icon: Receipt,
    },
    {
      key: "ROOMS",
      label: "ห้องพัก & สถานะ",
      badge: stayStats.stayCount,
      activeClass: "bg-sky-600 text-white shadow-xs",
      icon: BedDouble,
    },
    {
      key: "POS",
      label: "สินค้าขายได้ (POS)",
      badge: posItemSummary.length,
      activeClass: "bg-amber-600 text-white shadow-xs",
      icon: ShoppingBag,
    },
    {
      key: "STOCK",
      label: "เบิกของใช้ & สต๊อกใกล้หมด",
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      alert: lowStockCount > 0,
      activeClass: lowStockCount > 0 ? "bg-rose-600 text-white shadow-xs" : "bg-emerald-700 text-white shadow-xs",
      icon: lowStockCount > 0 ? AlertTriangle : PackageCheck,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden">
      {/* Tab Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-100/80 border-b border-slate-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? t.activeClass
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : t.alert
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-5">
        {activeTab === "UNPAID" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                รายการห้องพักที่ค้างชำระ ({openFolios.length} บิล)
              </h3>
              <Link href="/billing" className="text-xs font-semibold text-rose-600 hover:underline">
                จัดการรับชำระ →
              </Link>
            </div>
            {openFolios.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                ไม่มีบิลค้างชำระในขณะนี้
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {openFolios.map((f) => (
                  <Link
                    key={f.id}
                    href={`/billing?folioId=${f.id}`}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900">ห้อง {f.roomNumber}</span>{" "}
                      <span className="text-slate-700">• {f.guestName}</span>
                      <div className="text-[11px] text-slate-400">
                        {f.bookingCode}
                        {f.guestPhone && f.guestPhone !== "-" ? ` · โทร ${f.guestPhone}` : ""}
                      </div>
                    </div>
                    <span className="font-bold text-rose-600 shrink-0 text-sm">
                      ฿{f.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "ROOMS" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                สรุปการเข้าพัก &amp; สถานะห้องพัก
              </h3>
              <Link href="/front-desk" className="text-xs font-semibold text-sky-600 hover:underline">
                ดูผังห้อง →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                <div className="text-slate-500 font-medium">เข้าพักในช่วงที่เลือก</div>
                <div className="text-2xl font-bold text-slate-900">{stayStats.stayCount} ครั้ง</div>
                <div className="text-xs text-slate-700">
                  โซนปกติ {stayStats.stdStayCount} · โซน VIP {stayStats.vipStayCount}
                </div>
                <div className="text-[11px] text-slate-500">
                  รายวัน {stayStats.dailyStayCount} · ชั่วคราว {stayStats.shortTimeStayCount} · รายเดือน{" "}
                  {stayStats.monthlyStayCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                <div className="text-slate-500 font-medium">
                  สถานะห้องตอนนี้ ({stayStats.totalRooms} ห้อง)
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-medium">ว่างพร้อมพัก (VC)</span>
                  <span className="font-bold text-emerald-700">{stayStats.vacantCleanRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-700 font-medium">มีแขกพักอยู่</span>
                  <span className="font-bold text-sky-700">{stayStats.occupiedRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">รอทำความสะอาด</span>
                  <span className="font-bold text-amber-700">{stayStats.dirtyRooms}</span>
                </div>
                {stayStats.oooRooms > 0 && (
                  <div className="flex justify-between">
                    <span className="text-rose-600 font-medium">ปิดซ่อม</span>
                    <span className="font-bold text-rose-600">{stayStats.oooRooms}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "POS" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                รายการสินค้าที่ขายได้ (POS)
              </h3>
              <Link href="/pos" className="text-xs font-semibold text-amber-700 hover:underline">
                เปิดหน้า POS →
              </Link>
            </div>
            {posItemSummary.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                ยังไม่มีรายการขาย POS ในช่วงที่เลือก
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {posItemSummary.map((item, idx) => (
                  <div key={item.name} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-slate-800 truncate">
                      <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-slate-700">{item.qty} ชิ้น</span>
                      <span className="font-bold text-emerald-700 w-20 text-right">
                        ฿{item.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "STOCK" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                สรุปเบิกของใช้ &amp; แจ้งเตือนสต๊อกใกล้หมด
              </h3>
              <Link href="/stock" className="text-xs font-semibold text-sky-600 hover:underline">
                เช็กคลังสินค้า →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5">
                <div className="font-semibold text-slate-700">ของใช้ที่เบิกออก</div>
                {supplyIssueSummary.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">ไม่มีรายการเบิกในช่วงนี้</div>
                ) : (
                  <div className="space-y-1">
                    {supplyIssueSummary.map((s) => (
                      <div key={s.name} className="flex justify-between gap-2">
                        <span className="text-slate-700 truncate">{s.name}</span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {s.qty} {s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-rose-50/50 border border-rose-200 p-3.5 space-y-1.5">
                <div className="font-semibold text-rose-900">สินค้าใกล้หมดสต๊อก</div>
                {lowStockMenus.length === 0 && lowSupplies.length === 0 ? (
                  <div className="text-[11px] text-emerald-700 py-2">สต๊อกเพียงพอทุกรายการ</div>
                ) : (
                  <div className="space-y-1">
                    {lowStockMenus.map((m) => (
                      <div key={m.id} className="flex justify-between gap-2">
                        <span className="text-slate-700 truncate">{m.name}</span>
                        <span className="font-bold text-rose-600 shrink-0">เหลือ {m.stockQty}</span>
                      </div>
                    ))}
                    {lowSupplies.map((s) => (
                      <div key={s.id} className="flex justify-between gap-2">
                        <span className="text-slate-700 truncate">{s.name}</span>
                        <span className="font-bold text-rose-600 shrink-0">
                          เหลือ {s.stockQty} {s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
