"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LogOut,
  Maximize2,
  Printer,
  Receipt,
  Search,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { ResortLogo } from "@/components/ResortLogo";
import { ManualPrintButton } from "./ManualPrintButton";

type RoleTab = "ALL" | "FRONT" | "HOUSEKEEPING" | "POS" | "METERS" | "MANAGER";

interface ImagePreviewData {
  src: string;
  title: string;
  desc: string;
}

export function ManualClient() {
  const [activeTab, setActiveTab] = useState<RoleTab>("ALL");
  const [previewImage, setPreviewImage] = useState<ImagePreviewData | null>(null);

  const tabs: { id: RoleTab; label: string; icon: React.ReactNode; badgeColor: string }[] = [
    { id: "ALL", label: "ดูทั้งหมด (All)", icon: <Sparkles className="w-3.5 h-3.5" />, badgeColor: "bg-slate-800 text-white" },
    { id: "FRONT", label: "1. ฟรอนต์ / พนักงานต้อนรับ", icon: <BedDouble className="w-3.5 h-3.5" />, badgeColor: "bg-sky-700 text-white" },
    { id: "HOUSEKEEPING", label: "2. แผนกแม่บ้าน", icon: <Sparkles className="w-3.5 h-3.5" />, badgeColor: "bg-emerald-700 text-white" },
    { id: "POS", label: "3. ร้านอาหาร & มินิบาร์", icon: <UtensilsCrossed className="w-3.5 h-3.5" />, badgeColor: "bg-amber-700 text-white" },
    { id: "METERS", label: "4. จดมิเตอร์น้ำ-ไฟ", icon: <Zap className="w-3.5 h-3.5" />, badgeColor: "bg-violet-700 text-white" },
    { id: "MANAGER", label: "5. เจ้าของ & ผู้จัดการ", icon: <Shield className="w-3.5 h-3.5" />, badgeColor: "bg-rose-700 text-white" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2D160B] pb-20">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#2D160B] text-[#FAF5EE] border-b border-[#C89B35]/30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5EE]/10 hover:bg-[#FAF5EE]/20 text-[#F6DC93] text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้าเข้าสู่ระบบ</span>
            </Link>
            <div className="h-5 w-px bg-[#C89B35]/30 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-[#F6DC93]">TheRoom Resort ชุมแพ</div>
              <div className="text-[10px] text-[#EADFCF]/80">คู่มือการปฏิบัติงานระบบ (SOP พร้อมภาพประกอบ)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ManualPrintButton />
            <a
              href="/manual-theroom-resort.pdf"
              download="คู่มือการใช้งาน_TheRoom_Resort.pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF49] to-[#B68621] hover:from-[#DFBC59] hover:to-[#C69328] text-[#241007] text-xs font-bold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Banner Title */}
        <div className="bg-gradient-to-br from-[#2D160B] to-[#432313] text-[#FAF5EE] p-5 sm:p-7 rounded-2xl border-b-4 border-[#C89B35] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C89B35]/20 border border-[#C89B35]/40 text-[#F6DC93] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>คู่มือการใช้งานระบบระบบ TheRoom Resort 2026 (พร้อมภาพประกอบทุกฟังก์ชัน)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F6DC93]">
              คู่มือการปฏิบัติงานแยกตามตำแหน่งหน้าที่ (SOP)
            </h1>
            <p className="text-xs sm:text-sm text-[#EADFCF]/90 max-w-2xl leading-relaxed">
              สำหรับพนักงานต้อนรับ (ฟรอนต์), แผนกแม่บ้าน, ร้านอาหาร/POS, เจ้าหน้าที่จดมิเตอร์ และเจ้าของกิจการ/ผู้จัดการ
            </p>
          </div>
          <ResortLogo className="w-24 sm:w-28 h-auto drop-shadow-md shrink-0 hidden sm:block" />
        </div>

        {/* Role Filter Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-[#E6D9C2] shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-[#2D160B] text-[#F6DC93] shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Accounts Info Bar */}
        {(activeTab === "ALL" || activeTab === "FRONT" || activeTab === "HOUSEKEEPING" || activeTab === "MANAGER") && (
          <section className="bg-white rounded-2xl border border-[#E6D9C2] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0E6D6] pb-2.5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#C89B35]" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  รหัสผ่านเข้าใช้งานระบบแต่ละตำแหน่ง (กดเปลี่ยนบทบาทหน้าแรกได้ทันที)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">แตะรูปหน้าจอเพื่อขยายภาพใหญ่ได้ทุกรูป</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-sky-900">1. พนักงานต้อนรับ (Front Desk)</div>
                  <div className="text-xs text-slate-700">User: <strong className="text-slate-900">frontdesk</strong> | Pass: <strong className="text-slate-900">1234</strong></div>
                </div>
                <BedDouble className="w-5 h-5 text-sky-600 shrink-0" />
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-900">2. แม่บ้าน &amp; ซ่อมบำรุง</div>
                  <div className="text-xs text-slate-700">User: <strong className="text-slate-900">housekeeping</strong> | Pass: <strong className="text-slate-900">1234</strong></div>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-amber-900">3. เจ้าของ / ผู้จัดการ (Owner)</div>
                  <div className="text-xs text-slate-700">User: <strong className="text-slate-900">admin</strong> | Pass: <strong className="text-slate-900">admin123</strong></div>
                </div>
                <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ROLE 1: FRONT DESK                                            */}
        {/* ============================================================== */}
        {(activeTab === "ALL" || activeTab === "FRONT") && (
          <section className="bg-white rounded-2xl border border-sky-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-sky-900 to-sky-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-200 font-bold">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider">ตำแหน่งหน้าที่ 1</div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    คู่มือพนักงานต้อนรับ (Front Desk / ฟรอนต์)
                  </h2>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-sky-700/60 text-sky-200 border border-sky-500/40 hidden sm:inline-block">
                ผังห้องพัก • เช็คอิน • รับชำระ • เช็คเอาต์
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Color Code Legend */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ความหมายของสีสถานะบนผังห้อง 28 ห้อง:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>🟢 สีเขียว (VC): ว่างพร้อมพัก (เปิดขายได้)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-sky-100/80 border border-sky-300 text-sky-900 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
                    <span>🔵 สีฟ้า (OC): มีแขกเข้าพักอยู่</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                    <span>🟡 สีเหลือง (VD): รอแม่บ้านทำความสะอาด</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                    <span>🔴 สีแดง (OOO): ปิดปรับปรุง / ซ่อมบำรุง</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Room Grid Overview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    หน้าผังห้องพัก 28 ห้อง (เมนู: หน้าฟรอนต์ &amp; ผังห้อง)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  หน้าจอหลักสำหรับดูสถานะห้องทั้งหมด แบ่งเป็น โซน 1 (ห้อง 101–106) และ โซน 2 (ห้อง 201–206) สามารถคลิกที่แถบด้านบนเพื่อกรองดูเฉพาะห้องที่ว่าง หรือห้องที่มีแขกได้ทันที
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/02-frontdesk.png",
                      title: "หน้าผังห้องพัก 28 ห้อง (เดสก์ท็อป)",
                      desc: "แสดงสถานะห้องพัก 28 ห้องแบบเรียลไทม์ โซน 1 และ 2 พร้อมแถบกรองสถานะ",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/02-frontdesk.png" alt="ผังห้องพัก" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                      <Maximize2 className="w-4 h-4" /> แตะเพื่อดูภาพใหญ่
                    </div>
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: ผังห้องพักบนจอคอมพิวเตอร์</span>
                      <span className="text-sky-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/11-mobile-frontdesk.png",
                      title: "หน้าผังห้องพักบนมือถือ (iPhone / Smartphone)",
                      desc: "ฟรอนต์สามารถใช้มือถือเดินตรวจห้อง หรือเปิดรับเช็คอินได้ทุกที่ในรีสอร์ท",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100 flex flex-col justify-between"
                  >
                    <img src="/manual-images/11-mobile-frontdesk.png" alt="ผังห้องบนมือถือ" className="w-full max-h-[260px] object-contain mx-auto group-hover:scale-[1.01] transition duration-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                      <Maximize2 className="w-4 h-4" /> แตะเพื่อดูภาพใหญ่
                    </div>
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: ใช้งานผ่านมือถือ (PWA)</span>
                      <span className="text-sky-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Check-in / Open Room */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    ขั้นตอนการเปิดห้องพัก / เช็คอิน (Check-in Walk-in)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1.5">
                      <div className="font-bold text-sky-950">ขั้นตอนที่ต้องทำ:</div>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>คลิกที่ห้องที่มีป้าย <strong>สีเขียว (ว่างพร้อมพัก)</strong></li>
                        <li>เลือกรูปแบบการพัก:
                          <ul className="list-disc pl-3 text-slate-600 text-[11px] pt-0.5">
                            <li><strong>รายวัน (Daily):</strong> ค่าห้อง 450 บาท/คืน</li>
                            <li><strong>ชั่วคราว (3 ชม.):</strong> 400 บาท (สำหรับพักผ่อนระยะสั้น)</li>
                            <li><strong>รายเดือน (Monthly):</strong> 3,500 บาท/เดือน</li>
                          </ul>
                        </li>
                        <li>กรอกชื่อ และเบอร์โทรศัพท์ของแขก</li>
                        <li>ระบบจะเพิ่มยอด <strong>มัดจำกุญแจ 200 บาท</strong> ให้อัตโนมัติ</li>
                        <li>เลือกว่ารับเงินเป็น <strong>เงินสด</strong> หรือ <strong>โอน QR</strong></li>
                        <li>กดปุ่ม <strong>"ยืนยันเปิดห้องพัก"</strong> → ห้องจะเปลี่ยนเป็นสีฟ้าทันที!</li>
                      </ol>
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/03-checkin-modal.png",
                      title: "หน้าต่างเปิดห้อง / เช็คอิน (Check-in Popup)",
                      desc: "ฟอร์มเช็คอินรวดเร็ว รองรับรายวัน/ชั่วคราว/รายเดือน พร้อมคิดค่ามัดจำกุญแจและเลือกวิธีชำระเงิน",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/03-checkin-modal.png" alt="หน้าต่างเช็คอิน" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                      <Maximize2 className="w-4 h-4" /> แตะเพื่อดูภาพใหญ่
                    </div>
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: ป๊อปอัปฟอร์มเปิดห้อง</span>
                      <span className="text-sky-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Billing & Receipt */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    การคิดเงิน &amp; พิมพ์ใบเสร็จรับเงิน (เมนู: รับชำระ /billing)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/04-billing.png",
                      title: "หน้ารับชำระเงิน & ออกใบเสร็จ (Billing)",
                      desc: "สรุปรายการบิลของแต่ละห้องพัก ประวัติการรับเงินสด/เงินโอน และปุ่มกดพิมพ์ใบเสร็จ",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/04-billing.png" alt="หน้ารับชำระ" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                      <Maximize2 className="w-4 h-4" /> แตะเพื่อดูภาพใหญ่
                    </div>
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: เมนูรับชำระเงิน</span>
                      <span className="text-sky-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p>
                      เมื่อต้องการพิมพ์ใบเสร็จให้แขก สามารถกดเข้าไปที่ห้องพัก หรือเมนู <strong>"รับชำระ"</strong> แล้วกดไอคอนเครื่องพิมพ์ 🖨️
                    </p>
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
                      <div className="font-bold">📄 ขนาดใบเสร็จที่แนะนำ:</div>
                      <p className="text-[11px] leading-relaxed">
                        ใบเสร็จถูกออกแบบมาในขนาด <strong>ครึ่ง A4 (A5 แนวนอน 210 x 148.5 มม.)</strong> ประหยัดกระดาษ ดูเป็นมืออาชีพ มีชื่อที่พัก โลโก้ และเลขอ้างอิงครบถ้วน
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Check-out */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    ขั้นตอนการเช็คเอาต์ &amp; คืนเงินมัดจำกุญแจ (Check-out)
                  </h3>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>แขกนำกุญแจมาคืนที่ฟรอนต์ → คลิกที่ห้องที่มีแถบ <strong>สีฟ้า (มีแขกพัก)</strong></li>
                    <li>ตรวจสอบว่ามีค่าอาหาร/มินิบาร์ค้างชำระหรือไม่ หากมีให้เรียกเก็บเงิน</li>
                    <li>กดปุ่ม <strong>"ดำเนินการ Check-out"</strong></li>
                    <li>ตรวจสอบช่อง <strong>"คืนมัดจำกุญแจ 200.-"</strong> เลือกว่าคืนเป็นเงินสดหรือโอนคืน</li>
                    <li>กดยืนยันเช็คเอาต์ → ห้องจะเปลี่ยนเป็น <strong>สีเหลือง (รอแม่บ้านทำความสะอาด)</strong> ทันที</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ROLE 2: HOUSEKEEPING                                          */}
        {/* ============================================================== */}
        {(activeTab === "ALL" || activeTab === "HOUSEKEEPING") && (
          <section className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">ตำแหน่งหน้าที่ 2</div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    คู่มือแผนกแม่บ้าน &amp; ซ่อมบำรุง (Housekeeping)
                  </h2>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-700/60 text-emerald-200 border border-emerald-500/40 hidden sm:inline-block">
                ดูคิวทำความสะอาด • เปลี่ยนสถานะห้อง • เบิกของใช้
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="text-sm font-bold text-slate-900">
                      ดูห้องที่ต้องทำความสะอาดผ่านมือถือ (เมนู: แม่บ้าน)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    แม่บ้านสามารถล็อกอินผ่านมือถือด้วยบัญชี <strong>housekeeping (รหัส: 1234)</strong> ระบบจะแสดงเฉพาะห้องที่แขกเพิ่งเช็คเอาต์ (สีเหลือง) แบบเรียลไทม์ โดยไม่ต้องรอให้ฟรอนต์โทรบอก
                  </p>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs text-emerald-950">
                    <div className="font-bold">✨ ขั้นตอนการทำงานหน้างาน:</div>
                    <ul className="space-y-1 pl-1">
                      <li>• <strong>เดินไปที่ห้อง:</strong> กดปุ่มไอคอนเล่น ▶️ เพื่อแจ้งว่า <em>"กำลังทำความสะอาด"</em></li>
                      <li>• <strong>ตรวจมินิบาร์:</strong> เช็คขนม เครื่องดื่ม และสิ่งของชำรุด</li>
                      <li>• <strong>ทำความสะอาดเสร็จ:</strong> กดปุ่มเครื่องหมายถูก ✔️ ห้องจะเด้งเป็น <strong>สีเขียว (พร้อมขาย)</strong> ให้ฟรอนต์เห็นทันที!</li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/06-housekeeping.png",
                      title: "หน้ารายการงานแม่บ้าน (จอคอมพิวเตอร์)",
                      desc: "แสดงรายการห้องพักที่รอทำความสะอาด พร้อมปุ่มสลับสถานะเป็น 'พร้อมพัก' ได้ใน 1 คลิก",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/06-housekeeping.png" alt="หน้าแม่บ้าน" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[10px] font-semibold text-slate-700 bg-white border-t border-slate-200">
                      🖥️ หน้าจอคอม
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/13-mobile-housekeeping.png",
                      title: "หน้าแม่บ้านบนมือถือสมาร์ทโฟน",
                      desc: "ออกแบบมาให้กดง่ายด้วยนิ้วเดียวบนมือถือ เดินทำงานไปกดอัปเดตไปได้สะดวก",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/13-mobile-housekeeping.png" alt="หน้าแม่บ้านมือถือ" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[10px] font-semibold text-slate-700 bg-white border-t border-slate-200">
                      📱 บนมือถือ
                    </div>
                  </div>
                </div>
              </div>

              {/* Supply requisition */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    การเบิกของใช้ &amp; ผ้าปูที่นอน (เมนู: คลังของใช้ /supplies)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/08-supplies.png",
                      title: "คลังของใช้ & เบิกจ่าย (Supplies)",
                      desc: "บันทึกการเบิกสบู่ แชมพู ทิชชู ผ้าปูที่นอน ปลอกหมอน พร้อมระบบนับสต็อกคงเหลือ",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/08-supplies.png" alt="คลังของใช้" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: หน้าคลังของใช้และของในห้อง</span>
                      <span className="text-emerald-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p>
                      เมื่อต้องการนำสบู่ ยาสระผม กระดาษทิชชู หรือชุดเครื่องนอนไปเติมในห้อง ให้เข้าเมนู <strong>"คลังของใช้"</strong>
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>เลือกรายการสิ่งของที่ต้องการเบิก</li>
                      <li>ใส่จำนวนที่เบิกไปใช้งาน</li>
                      <li>กดยืนยันเบิก → ยอดสต็อกคงเหลือในระบบจะลดลงอัตโนมัติ เพื่อให้ผู้จัดการสั่งซื้อของเพิ่มได้ทันท่วงที</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ROLE 3: POS & RESTAURANT                                      */}
        {/* ============================================================== */}
        {(activeTab === "ALL" || activeTab === "POS") && (
          <section className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-200 font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">ตำแหน่งหน้าที่ 3</div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    คู่มือร้านอาหาร, เครื่องดื่ม &amp; มินิบาร์ (POS &amp; Cashier)
                  </h2>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-700/60 text-amber-200 border border-amber-500/40 hidden sm:inline-block">
                ขายหน้าร้าน • โต๊ะอาหาร • สั่งลงบิลห้องพัก
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="text-sm font-bold text-slate-900">
                      การรับออเดอร์ &amp; เลือกโต๊ะอาหาร (เมนู: ห้องอาหาร/POS)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    หน้าจอ POS ถูกออกแบบมาให้แตะเลือกรายการอาหารและเครื่องดื่มได้สะดวกรวดเร็ว ทั้งจากคอมพิวเตอร์และแท็บเล็ต/มือถือ
                  </p>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-950">
                    <div className="font-bold">ขั้นตอนการเปิดบิลอาหาร:</div>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>เลือกโต๊ะนั่ง (โต๊ะ T1–T6) หรือเลือก "ซื้อกลับบ้าน"</li>
                      <li>แตะเมนูอาหาร/เครื่องดื่มที่ลูกค้าสั่ง (รายการจะปรากฏในตะกร้าขวา)</li>
                      <li>ตรวจสอบยอดเงินรวม</li>
                    </ol>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/05-pos.png",
                      title: "หน้าต่างขายหน้าร้าน (POS Desktop)",
                      desc: "หน้าจอสั่งอาหาร เมนูสินค้า ผังโต๊ะ T1-T6 และตะกร้าสรุปยอดชำระเงิน",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/05-pos.png" alt="POS หน้าจอคอม" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[10px] font-semibold text-slate-700 bg-white border-t border-slate-200">
                      🖥️ หน้าจอ POS เต็มจอ
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/12-mobile-pos.png",
                      title: "หน้า POS บนมือถือ (Mobile Cashier)",
                      desc: "พนักงานเสิร์ฟสามารถถือมือถือไปรับออเดอร์ที่โต๊ะลูกค้าได้ทันที",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/12-mobile-pos.png" alt="POS มือถือ" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[10px] font-semibold text-slate-700 bg-white border-t border-slate-200">
                      📱 บนมือถือพนักงานเสิร์ฟ
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Room Charge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    รูปแบบการคิดเงิน (จ่ายสด / โอน / ลงบิลห้องพัก Room Charge)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <strong className="text-slate-900">💵 ลูกค้าจ่ายทันที:</strong>
                    <p className="text-slate-600 text-[11px]">
                      เลือกว่ารับเป็นเงินสด หรือเปิด QR Code ให้ลูกค้าสแกนโอนเงิน จากนั้นกดยืนยันรับเงิน
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <strong className="text-slate-900">🏨 ลงบิลห้องพัก (Room Charge):</strong>
                    <p className="text-slate-600 text-[11px]">
                      หากเป็นแขกที่พักในรีสอร์ท สามารถเลือก <em>"ลงบิลห้องพัก"</em> แล้วเลือกเลขห้อง (เช่น ห้อง 102) ยอดเงินจะถูกนำไปรวมในบิลของฟรอนต์อัตโนมัติเพื่อคิดเงินตอนเช็คเอาต์
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ROLE 4: METERS & UTILITIES                                    */}
        {/* ============================================================== */}
        {(activeTab === "ALL" || activeTab === "METERS") && (
          <section className="bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-900 to-violet-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-violet-200 font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">ตำแหน่งหน้าที่ 4</div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    คู่มือเจ้าหน้าที่จดมิเตอร์น้ำ-ไฟ (ห้องพักรายเดือน)
                  </h2>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-700/60 text-violet-200 border border-violet-500/40 hidden sm:inline-block">
                มิเตอร์ไฟ • มิเตอร์น้ำ • คำนวณค่ายูนิตอัตโนมัติ
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => setPreviewImage({
                    src: "/manual-images/07-meters.png",
                    title: "หน้าจดมิเตอร์น้ำ-ไฟ (Meters Management)",
                    desc: "หน้าบันทึกเลขอ่านมิเตอร์น้ำและไฟของแต่ละห้องพัก พร้อมคำนวณส่วนต่างยูนิตอัตโนมัติ",
                  })}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                >
                  <img src="/manual-images/07-meters.png" alt="หน้าจดมิเตอร์" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                  <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                    <span>ภาพ: หน้าบันทึกมิเตอร์น้ำ-ไฟ</span>
                    <span className="text-violet-700">🔍 ดูรูปใหญ่</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="text-sm font-bold text-slate-900">
                      รอบการจดและการคำนวณ (เมนู: จดมิเตอร์น้ำ-ไฟ)
                    </h3>
                  </div>
                  <p>
                    สำหรับห้องพักรายเดือน เจ้าหน้าที่จะเดินจดมิเตอร์ทุกสิ้นเดือน หรือวันที่แขกย้ายออก
                  </p>
                  <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 space-y-1.5 text-violet-950">
                    <div className="font-bold">⚡ อัตราค่าบริการตามมาตรฐาน:</div>
                    <ul className="space-y-1 pl-1 text-[11px]">
                      <li>• <strong>ค่าไฟ:</strong> หน่วยละ 7 บาท (ระบบคำนวณ: <em>เลขครั้งนี้ - เลขครั้งก่อน × 7</em>)</li>
                      <li>• <strong>ค่าน้ำ:</strong> หน่วยละ 18 บาท (ระบบคำนวณ: <em>เลขครั้งนี้ - เลขครั้งก่อน × 18</em>)</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    * เมื่อกดบันทึก ยอดค่าน้ำค่าไฟจะถูกส่งเข้าไปรวมในใบแจ้งหนี้ค่าห้องรายเดือนของห้องนั้นโดยอัตโนมัติ
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ROLE 5: OWNER & MANAGER                                       */}
        {/* ============================================================== */}
        {(activeTab === "ALL" || activeTab === "MANAGER") && (
          <section className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-rose-950 to-rose-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-rose-200 font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">ตำแหน่งหน้าที่ 5</div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    คู่มือเจ้าของกิจการ &amp; ผู้จัดการ (Owner / Manager)
                  </h2>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-800/60 text-rose-200 border border-rose-500/40 hidden sm:inline-block">
                รายงานสรุปยอด • การเงิน • ตั้งค่านโยบาย • บัญชีพนักงาน
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Reports Dashboard */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-700 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    หน้าแดชบอร์ดรายงานรายได้สรุปยอด (เมนู: รายงานสรุปยอด /reports)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ตรวจสอบผลการดำเนินงานแบบเรียลไทม์ ทั้งยอดเงินสด เงินโอน รายได้จากห้องพัก รายได้จาก POS และอัตราการเข้าพัก (Occupancy Rate)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/09-reports.png",
                      title: "หน้าแดชบอร์ดรายงานสรุปยอด (Reports Dashboard)",
                      desc: "รายงานยอดรับเงินสุทธิ สัดส่วนเงินสด/เงินโอน ยอดขายห้องพัก ยอดขาย POS และประวัติมัดจำกุญแจ",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/09-reports.png" alt="หน้ารายงาน" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: แดชบอร์ดรายงานการเงิน</span>
                      <span className="text-rose-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-rose-950">
                      <div className="font-bold">📊 รายละเอียดในรายงาน:</div>
                      <ul className="space-y-1 pl-1 text-[11px]">
                        <li>• <strong>แยกประเภทการชำระ:</strong> เงินสดในเก๊ะ vs เงินโอนเข้าบัญชีธนาคารชัดเจน</li>
                        <li>• <strong>ช่วงเวลา:</strong> เลือกดู "วันนี้", "7 วันล่าสุด", "เดือนนี้" หรือ "ทั้งหมด"</li>
                        <li>• <strong>มัดจำกุญแจ:</strong> ยอดรับเข้า, ยอดคืน และยอดที่ถือรอคืน ป้องกันเงินสูญหาย</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings & User Management */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-700 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    การตั้งค่าราคา &amp; บัญชีพนักงาน (เมนู: ตั้งค่าระบบ /settings)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="font-bold text-slate-900">⚙️ สิ่งที่ผู้จัดการสามารถปรับแต่งได้:</div>
                      <ul className="space-y-1 pl-1 text-[11px] text-slate-600">
                        <li>• <strong>ราคาห้องพัก:</strong> ปรับราคามาตรฐานรายวัน รายเดือน และชั่วคราว</li>
                        <li>• <strong>ค่าน้ำ-ไฟ:</strong> ปรับอัตราหน่วยค่าน้ำและค่าไฟฟ้า</li>
                        <li>• <strong>จัดการพนักงาน:</strong> เพิ่มบัญชีพนักงานใหม่ หรือรีเซ็ตรหัสผ่าน</li>
                        <li>• <strong>ตรวจสอบ Audit Log:</strong> ดูย้อนหลังได้ว่าใครเปิดห้อง ลบบิล หรือแก้ไขข้อมูลเวลาใด</li>
                      </ul>
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewImage({
                      src: "/manual-images/10-settings.png",
                      title: "หน้าตั้งค่าระบบ (Settings)",
                      desc: "จัดการข้อมูลที่พัก ราคาห้องพัก นโยบายมัดจำ และรายชื่อบัญชีพนักงานทั้งหมด",
                    })}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer bg-slate-100"
                  >
                    <img src="/manual-images/10-settings.png" alt="หน้าตั้งค่า" className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-200" />
                    <div className="p-2 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200 flex justify-between">
                      <span>ภาพ: เมนูตั้งค่าระบบและนโยบาย</span>
                      <span className="text-rose-700">🔍 ดูรูปใหญ่</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Download PDF & Action Card */}
        <section className="bg-gradient-to-r from-[#FAF0DC] to-[#F6E6C5] rounded-2xl border border-[#C89B35]/40 p-5 sm:p-6 text-center space-y-3 shadow-xs">
          <FileText className="w-8 h-8 text-[#9E731A] mx-auto" />
          <h3 className="text-base font-bold text-[#2D160B]">
            ต้องการเอกสารคู่มือฉบับพิมพ์หรือไฟล์ PDF สมบูรณ์?
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            สามารถกดดาวน์โหลดไฟล์ PDF คู่มือฉบับเต็มเพื่อนำไปพิมพ์เคลือบพลาสติกติดไว้ที่โต๊ะทำงานหน้าฟรอนต์ หรือส่งต่อให้พนักงานใหม่ศึกษาได้ทันที
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/manual-theroom-resort.pdf"
              download="คู่มือการใช้งาน_TheRoom_Resort.pdf"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D160B] hover:bg-[#432313] text-[#F6DC93] text-xs font-bold shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ PDF คู่มือ (ฉบับพิมพ์)</span>
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#C89B35]/40 text-[#2D160B] text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์หน้านี้ (Print)</span>
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#C89B35]/40 text-[#2D160B] text-xs font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าเข้าสู่ระบบ</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Lightbox / Zoom Image Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 transition-all"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#2D160B] border border-[#C89B35]/50 text-[#FAF5EE] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-3.5 sm:p-4 border-b border-[#C89B35]/30 flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#F6DC93]">
                  {previewImage.title}
                </h4>
                <p className="text-xs text-[#EADFCF]/80">{previewImage.desc}</p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF5EE] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
