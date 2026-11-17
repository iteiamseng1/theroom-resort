import Link from "next/link";
import { ArrowLeft, Download, FileText, Printer, Shield, User, Sparkles } from "lucide-react";
import { ResortLogo } from "@/components/ResortLogo";
import { ManualPrintButton } from "./ManualPrintButton";

export const metadata = {
  title: "คู่มือการใช้งานระบบ — TheRoom Resort ชุมแพ",
  description: "คู่มือการปฏิบัติงานและใช้งานระบบบริหารโรงแรม TheRoom Resort ชุมแพ แยกตามตำแหน่งงาน",
};

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2D160B] pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#2D160B] text-[#FAF5EE] border-b border-[#C89B35]/30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
              <div className="text-[10px] text-[#EADFCF]/80">คู่มือการใช้งานระบบ (SOP)</div>
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
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Banner Title */}
        <div className="bg-gradient-to-br from-[#2D160B] to-[#432313] text-[#FAF5EE] p-5 sm:p-7 rounded-2xl border-b-4 border-[#C89B35] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C89B35]/20 border border-[#C89B35]/40 text-[#F6DC93] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>คู่มือการใช้งานระบบ 2026 (ฉบับเข้าใจง่าย)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F6DC93] pt-1">
              คู่มือการใช้งานระบบ TheRoom Resort ชุมแพ
            </h1>
            <p className="text-xs sm:text-sm text-[#EADFCF]/90">
              ระบบบริหารโรงแรม, ที่พักรายเดือน &amp; ห้องอาหาร POS แยกตามตำแหน่งงาน
            </p>
          </div>
          <ResortLogo className="w-24 sm:w-28 h-auto drop-shadow-md shrink-0 hidden sm:block" />
        </div>

        {/* Section 1: Quick Accounts */}
        <section className="bg-white rounded-2xl border border-[#E6D9C2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0E6D6] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF0DC] flex items-center justify-center text-[#9E731A] font-bold">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ข้อมูลบัญชีผู้ใช้งานแยกตามตำแหน่ง (Login Accounts)
              </h2>
              <p className="text-xs text-slate-500">สามารถกดทดลองเข้าใช้งานจากปุ่มด่วนหน้าแรกได้ทันที</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Owner */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                  เจ้าของ / ผู้จัดการ
                </span>
                <Shield className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">ชื่อผู้ใช้: <strong className="text-slate-800">admin</strong></div>
                <div className="text-xs text-slate-500">รหัสผ่าน: <strong className="text-slate-800">admin123</strong></div>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                ดูรายงานยอด, ตั้งค่านโยบาย, อนุมัติรหัสผ่านพนักงาน, ควบคุมสต๊อกกลาง
              </p>
            </div>

            {/* Front Desk */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-200 text-sky-900">
                  พนักงานต้อนรับ
                </span>
                <User className="w-4 h-4 text-sky-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">ชื่อผู้ใช้: <strong className="text-slate-800">frontdesk</strong></div>
                <div className="text-xs text-slate-500">รหัสผ่าน: <strong className="text-slate-800">1234</strong></div>
              </div>
              <p className="text-[11px] text-sky-900/80 leading-relaxed">
                ดูผังห้อง 28 ห้อง, เช็คอิน/เช็คเอาต์, คิดเงิน, พิมพ์ใบเสร็จ A5, คืนมัดจำ
              </p>
            </div>

            {/* Housekeeping */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                  แม่บ้าน &amp; ซ่อมบำรุง
                </span>
                <User className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">ชื่อผู้ใช้: <strong className="text-slate-800">housekeeping</strong></div>
                <div className="text-xs text-slate-500">รหัสผ่าน: <strong className="text-slate-800">1234</strong></div>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                ใช้งานบนมือถือ, ดูห้องรอทำความสะอาด, เปลี่ยนสถานะพร้อมขาย, เบิกของใช้
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Owner / Manager */}
        <section className="bg-white rounded-2xl border border-[#E6D9C2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0E6D6] pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                คู่มือ: เจ้าของกิจการ &amp; ผู้จัดการ (Owner / Manager)
              </h2>
              <p className="text-xs text-slate-500">บริหาร ควบคุมยอดขาย และความเรียบร้อยทั้งระบบ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#EADFCF] space-y-1">
              <div className="font-bold text-xs text-[#2D160B]">1. รายงานสรุปยอดขาย (/reports)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ดูรายได้รวมประจำวัน, สัดส่วนแขกรายวัน vs รายเดือน, เปอร์เซ็นต์ห้องพัก (Occupancy Rate), และยอดบิลค้างชำระแบบเรียลไทม์
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#EADFCF] space-y-1">
              <div className="font-bold text-xs text-[#2D160B]">2. ตั้งค่าระบบ &amp; นโยบาย (/settings)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                แก้ไขข้อมูลที่พัก, ราคาห้องชั่วคราว (เช่น 400.-/3 ชม.), อัตราค่าน้ำ (18.-/หน่วย), ค่าไฟ (7.-/หน่วย), และเงินมัดจำกุญแจมาตรฐาน
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#EADFCF] space-y-1">
              <div className="font-bold text-xs text-[#2D160B]">3. จัดการผู้ใช้ &amp; อนุมัติรหัสผ่าน</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เพิ่มพนักงานใหม่, ระงับบัญชีพนักงานที่ลาออก, และกดอนุมัติคำขอรีเซ็ตรหัสผ่าน (กรณีพนักงานลืมรหัส) ได้ในคลิกเดียว
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#EADFCF] space-y-1">
              <div className="font-bold text-xs text-[#2D160B]">4. ตรวจสอบประวัติการทำงาน (Audit Log)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ระบบบันทึกว่าใครเปิดห้อง, ใครรับเงินสด, หรือแก้ไขบิลย้อนหลัง ป้องกันการทุจริตและตรวจสอบความโปร่งใสได้ 100%
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Front Desk */}
        <section className="bg-white rounded-2xl border border-[#E6D9C2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0E6D6] pb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-800 font-bold">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                คู่มือ: พนักงานต้อนรับ (Front Desk)
              </h2>
              <p className="text-xs text-slate-500">ผังห้องพัก 28 ห้อง, การเปิดห้อง, รับเงิน และเช็คเอาต์</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-2">ความหมายของสีสถานะผังห้อง:</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                🟢 สีเขียว (VC): ว่างพร้อมพัก (พร้อมขาย)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 font-semibold">
                🔵 สีฟ้า (OC): มีแขกพักอยู่
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-semibold">
                🟡 สีเหลือง (VD): รอแม่บ้านทำความสะอาด (ห้ามขาย)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-semibold">
                🔴 สีแดง (OOO): ปิดซ่อม/ชำรุด
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-200 space-y-1">
              <div className="font-bold text-xs text-sky-950">1. การเปิดห้องพัก (Check-in)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                คลิกห้อง <strong>สีเขียว (VC)</strong> → เลือกประเภท (รายวัน/ชั่วคราว 3 ชม./รายเดือน) → ใส่ชื่อเบอร์โทรลูกค้า → รับค่าห้อง + ค่ามัดจำกุญแจ 200 บาท → กดบันทึกเปิดห้องทันที
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-200 space-y-1">
              <div className="font-bold text-xs text-sky-950">2. การคิดเงิน &amp; พิมพ์ใบเสร็จ (/billing)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เข้าเมนู "รับชำระ" → เลือกว่ารับด้วยเงินสดหรือ QR โอนเงิน → เมื่อรับเงินแล้ว กดปุ่มเครื่องพิมพ์เพื่อออกใบเสร็จขนาด <strong>ครึ่ง A4 (A5 แนวนอน)</strong> ได้ทันที
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-200 space-y-1">
              <div className="font-bold text-xs text-sky-950">3. การย้ายห้อง &amp; ต่อเวลาพัก</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                คลิกที่ห้อง → กด <strong>"ย้ายห้อง"</strong> แล้วเลือกห้องว่างปลายทาง (บิลและประวัติจะย้ายตามอัตโนมัติ) หรือกด <strong>"ต่อเวลาพัก"</strong> เพื่อขยายวันเช็คเอาต์
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-200 space-y-1">
              <div className="font-bold text-xs text-sky-950">4. การเช็คเอาต์ (Check-out)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                แขกคืนกุญแจ → คลิกห้อง → กด <strong>"ดำเนินการ Check-out"</strong> → กดปุ่มคืนเงินมัดจำกุญแจ [200.-] → กดยืนยัน ห้องจะกลายเป็น <strong>สีเหลือง (รอแม่บ้าน)</strong> ทันที
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Housekeeping */}
        <section className="bg-white rounded-2xl border border-[#E6D9C2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0E6D6] pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                คู่มือ: แผนกแม่บ้าน &amp; ซ่อมบำรุง (Housekeeping)
              </h2>
              <p className="text-xs text-slate-500">ใช้งานง่ายผ่านมือถือ ไม่ต้องโทรบอกฟรอนต์</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-1">
              <div className="font-bold text-xs text-emerald-950">1. เปิดดูงานบนมือถือ (/housekeeping)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เปิดแอปบนมือถือ จะเห็นรายการห้องที่แขกเพิ่งเช็คเอาต์ทันที เดินไปที่ห้องแล้วกดปุ่ม <strong>"เริ่มทำความสะอาด" (Play)</strong> เพื่อแจ้งฟรอนต์ว่ากำลังเข้าทำ
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-1">
              <div className="font-bold text-xs text-emerald-950">2. ตรวจเช็คมินิบาร์ &amp; ความเสียหาย</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ตรวจดูว่ามีน้ำอัดลมหรือขนมที่เปิดทานหรือไม่ หากมี ให้แจ้งฟรอนต์ทันทีก่อนแขกออกจากเคาน์เตอร์ และตรวจเช็คสิ่งของที่แขกลืมไว้
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-1">
              <div className="font-bold text-xs text-emerald-950">3. กดเสร็จสิ้น ห้องพร้อมขายทันที!</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เมื่อทำความสะอาดเสร็จ ปูเตียงเรียบร้อย กดปุ่ม <strong>"ทำความสะอาดเสร็จแล้ว" (เครื่องหมายถูก)</strong> สถานะห้องจะเด้งเป็น <strong>สีเขียว (พร้อมขาย)</strong> บนหน้าจอของฟรอนต์ทันที!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-1">
              <div className="font-bold text-xs text-emerald-950">4. การเบิกของใช้ (/supplies)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เข้าเมนู "เบิกของใช้" เลือกสบู่ แชมพู ทิชชู น้ำดื่ม ผ้าปูที่นอน ระบุจำนวนแล้วกดเบิก ระบบจะตัดสต๊อกกลางให้อัตโนมัติ
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Download & Print Box */}
        <section className="bg-gradient-to-r from-[#FAF0DC] to-[#F6E6C5] rounded-2xl border border-[#C89B35]/40 p-5 sm:p-6 text-center space-y-3">
          <FileText className="w-8 h-8 text-[#9E731A] mx-auto" />
          <h3 className="text-base font-bold text-[#2D160B]">
            ต้องการเอกสารคู่มือฉบับพิมพ์หรือไฟล์ PDF สมบูรณ์?
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            สามารถกดดาวน์โหลดไฟล์ PDF ขนาด 2 หน้า A4 เพื่อพิมพ์เคลือบพลาสติกติดไว้ที่โต๊ะทำงานหน้าฟรอนต์หรือส่งให้พนักงานอ่านได้ทันที
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/manual-theroom-resort.pdf"
              download="คู่มือการใช้งาน_TheRoom_Resort.pdf"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D160B] hover:bg-[#432313] text-[#F6DC93] text-xs font-bold shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ PDF (ขนาด 480 KB)</span>
            </a>
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
    </div>
  );
}
