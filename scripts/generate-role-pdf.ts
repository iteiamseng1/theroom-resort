import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const outputHtmlPath = path.join(process.cwd(), "scripts", "manual-role-print.html");
const outputPdfPath = path.join(process.cwd(), "public", "manual-theroom-resort.pdf");

// Convert image to base64 data URI so Chrome headless embeds it 100% reliably
function getBase64Image(filename: string): string {
  const imgPath = path.join(process.cwd(), "public", "manual-images", filename);
  if (fs.existsSync(imgPath)) {
    const ext = path.extname(filename).replace(".", "");
    const base64 = fs.readFileSync(imgPath).toString("base64");
    return `data:image/${ext};base64,${base64}`;
  }
  return "";
}

const imgFrontDesk = getBase64Image("02-frontdesk.png");
const imgCheckinModal = getBase64Image("03-checkin-modal.png");
const imgBilling = getBase64Image("04-billing.png");
const imgPos = getBase64Image("05-pos.png");
const imgHousekeeping = getBase64Image("06-housekeeping.png");
const imgMobileHk = getBase64Image("13-mobile-housekeeping.png");
const imgMeters = getBase64Image("07-meters.png");
const imgSupplies = getBase64Image("08-supplies.png");
const imgReports = getBase64Image("09-reports.png");
const imgSettings = getBase64Image("10-settings.png");

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คู่มือการปฏิบัติงานระบบ TheRoom Resort ชุมแพ (แยกตามตำแหน่งงาน)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Sarabun', 'Leelawadee UI', Tahoma, sans-serif;
      margin: 0;
      padding: 0;
      color: #2D160B;
      background: #FFFFFF;
      font-size: 11.5px;
      line-height: 1.4;
    }

    .page {
      page-break-after: always;
      position: relative;
      height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header & Branding */
    .header-banner {
      background: linear-gradient(135deg, #2D160B 0%, #432313 100%);
      color: #FAF5EE;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #C89B35;
    }

    .header-left h1 {
      margin: 0 0 2px 0;
      font-size: 17px;
      font-weight: 700;
      color: #F6DC93;
    }

    .header-left p {
      margin: 0;
      font-size: 10.5px;
      color: #EADFCF;
    }

    .header-badge {
      background: rgba(200, 155, 53, 0.25);
      border: 1px solid #C89B35;
      color: #F6DC93;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
    }

    /* Section & Cards */
    .section-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #2D160B;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #E6D9C2;
      padding-bottom: 4px;
    }

    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
    }
    .badge-front { background: #0284c7; }
    .badge-hk { background: #059669; }
    .badge-pos { background: #d97706; }
    .badge-meter { background: #7c3aed; }
    .badge-admin { background: #e11d48; }

    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .account-card {
      border: 1px solid #E2D5BE;
      border-radius: 8px;
      padding: 6px 10px;
      background: #FAF6EE;
      font-size: 10.5px;
    }

    .account-card strong {
      color: #2D160B;
    }

    .step-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    .step-box {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 8px 10px;
      background: #F9FAFB;
    }

    .step-num {
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      text-align: center;
      background: #2D160B;
      color: #F6DC93;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      margin-right: 5px;
    }

    .step-title {
      font-weight: 700;
      color: #111827;
      font-size: 11px;
    }

    .step-desc {
      font-size: 10px;
      color: #4B5563;
      margin-top: 3px;
      line-height: 1.35;
    }

    .img-card {
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      overflow: hidden;
      background: #FFFFFF;
      margin-top: 4px;
      text-align: center;
    }

    .img-card img {
      width: 100%;
      height: 125px;
      object-fit: cover;
      display: block;
    }

    .img-caption {
      font-size: 9px;
      color: #4B5563;
      padding: 3px 6px;
      background: #F3F4F6;
      border-top: 1px solid #E5E7EB;
      font-weight: 600;
    }

    .color-legend {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .legend-item {
      padding: 4px 6px;
      border-radius: 6px;
      font-size: 9.5px;
      font-weight: 600;
      text-align: center;
    }
    .leg-vc { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
    .leg-oc { background: #E0F2FE; color: #075985; border: 1px solid #7DD3FC; }
    .leg-vd { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
    .leg-ooo { background: #FFE4E6; color: #9F1239; border: 1px solid #FDA4AF; }

    .alert-box {
      background: #FFFBEB;
      border-left: 3px solid #F59E0B;
      padding: 6px 10px;
      font-size: 10px;
      color: #92400E;
      border-radius: 4px;
      margin-top: 6px;
    }

    .footer {
      border-top: 1px solid #E5E7EB;
      padding-top: 6px;
      font-size: 9px;
      color: #9CA3AF;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: FRONT DESK ================= -->
  <div class="page">
    <div>
      <div class="header-banner">
        <div class="header-left">
          <h1>TheRoom Resort ชุมแพ — คู่มือการใช้งานระบบ (SOP)</h1>
          <p>คู่มือการปฏิบัติงานแยกตามตำแหน่งหน้าที่ พร้อมภาพหน้าจอระบบจริง</p>
        </div>
        <div class="header-badge">หน้า 1 / 3 • พนักงานต้อนรับ</div>
      </div>

      <div class="accounts-grid">
        <div class="account-card">
          <span class="role-badge badge-front">ฟรอนต์</span> <strong>frontdesk</strong> / 1234
        </div>
        <div class="account-card">
          <span class="role-badge badge-hk">แม่บ้าน</span> <strong>housekeeping</strong> / 1234
        </div>
        <div class="account-card">
          <span class="role-badge badge-admin">ผู้จัดการ</span> <strong>admin</strong> / admin123
        </div>
      </div>

      <div class="section-title">
        <span class="role-badge badge-front">ตำแหน่งที่ 1</span> พนักงานต้อนรับ (Front Desk / ฟรอนต์)
      </div>

      <div class="color-legend">
        <div class="legend-item leg-vc">🟢 VC: ว่างพร้อมพัก (เปิดขายได้)</div>
        <div class="legend-item leg-oc">🔵 OC: มีแขกพักอยู่</div>
        <div class="legend-item leg-vd">🟡 VD: รอแม่บ้านทำความสะอาด</div>
        <div class="legend-item leg-ooo">🔴 OOO: ปิดปรับปรุง / ซ่อม</div>
      </div>

      <div class="step-grid">
        <!-- Step 1 -->
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">ผังห้องพัก 28 ห้อง (/front-desk)</span>
          <div class="step-desc">
            • ตรวจดูห้องว่างแบบเรียลไทม์ (โซน 1: 101–106, โซน 2: 201–206)<br>
            • กรองสถานะได้จากแถบด้านบน (ทั้งหมด / พร้อม / มีแขกพัก / ทำความสะอาด)
          </div>
          <div class="img-card">
            <img src="${imgFrontDesk}" alt="ผังห้องพัก">
            <div class="img-caption">ภาพที่ 1: ผังห้องพัก 28 ห้องแบบเรียลไทม์</div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">การเปิดห้อง / เช็คอิน (Check-in)</span>
          <div class="step-desc">
            • คลิกห้อง <strong>สีเขียว (VC)</strong> → เลือกประเภท: รายวัน (450.-), ชั่วคราว 3 ชม. (400.-) หรือรายเดือน (3,500.-)<br>
            • ใส่ชื่อและเบอร์โทร → เก็บค่าห้อง + มัดจำกุญแจ 200.-
          </div>
          <div class="img-card">
            <img src="${imgCheckinModal}" alt="หน้าต่างเช็คอิน">
            <div class="img-caption">ภาพที่ 2: ป๊อปอัปเปิดห้อง & บันทึกมัดจำกุญแจ</div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">การคิดเงิน & พิมพ์ใบเสร็จ (/billing)</span>
          <div class="step-desc">
            • รับเงินสด หรือ สแกน QR โอนเงิน<br>
            • กดไอคอนเครื่องพิมพ์เพื่อออกใบเสร็จขนาด <strong>ครึ่ง A4 (A5 แนวนอน)</strong><br>
            • รองรับการย้ายห้องและต่อเวลาพักอัตโนมัติ
          </div>
          <div class="img-card">
            <img src="${imgBilling}" alt="หน้ารับชำระ">
            <div class="img-caption">ภาพที่ 3: เมนูรับชำระและประวัติการเงิน</div>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">การเช็คเอาต์ & คืนมัดจำกุญแจ</span>
          <div class="step-desc">
            • แขกคืนกุญแจ → คลิกห้องสีฟ้า → กด <strong>"ดำเนินการ Check-out"</strong><br>
            • เช็คว่ามีค่าอาหารค้างชำระหรือไม่<br>
            • กดปุ่มคืนมัดจำกุญแจ [200.-] → กดยืนยัน ห้องจะกลายเป็น <strong>สีเหลือง (รอแม่บ้าน)</strong> ทันที
          </div>
          <div class="alert-box">
            ⚠️ <strong>ข้อควรระวัง:</strong> อย่าลืมคืนเงินมัดจำกุญแจ 200 บาทให้แขกก่อนกดยืนยันเช็คเอาต์
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>TheRoom Resort ชุมแพ • คู่มือระบบบริหารจัดการโรงแรม</span>
      <span>หน้า 1 จาก 3</span>
    </div>
  </div>

  <!-- ================= PAGE 2: HOUSEKEEPING & POS ================= -->
  <div class="page">
    <div>
      <div class="header-banner">
        <div class="header-left">
          <h1>TheRoom Resort ชุมแพ — คู่มือการใช้งานระบบ (SOP)</h1>
          <p>แผนกแม่บ้าน & ซ่อมบำรุง และร้านอาหาร / มินิบาร์ POS</p>
        </div>
        <div class="header-badge">หน้า 2 / 3 • แม่บ้าน & POS</div>
      </div>

      <!-- Housekeeping Section -->
      <div class="section-title">
        <span class="role-badge badge-hk">ตำแหน่งที่ 2</span> แผนกแม่บ้าน & ซ่อมบำรุง (Housekeeping)
      </div>

      <div class="step-grid">
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">ดูคิวทำความสะอาดบนมือถือ (/housekeeping)</span>
          <div class="step-desc">
            • ล็อกอิน <strong>housekeeping / 1234</strong> ผ่านมือถือ<br>
            • ห้องที่แขกเช็คเอาต์จะขึ้นเป็นสีเหลืองทันที<br>
            • เดินไปถึงห้อง กดปุ่มไอคอนเล่น ▶️ เพื่อแจ้งว่ากำลังเข้าทำความสะอาด
          </div>
          <div class="img-card">
            <img src="${imgMobileHk}" alt="แม่บ้านมือถือ">
            <div class="img-caption">ภาพที่ 4: หน้าจอแม่บ้านบนสมาร์ทโฟน</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">ตรวจมินิบาร์ & กดเสร็จสิ้นห้องพร้อมขาย</span>
          <div class="step-desc">
            • ตรวจเช็คเครื่องดื่ม ขนม และสิ่งของชำรุด<br>
            • ทำความสะอาดเสร็จ ปูเตียงเรียบร้อย กดปุ่มเครื่องหมายถูก ✔️<br>
            • ห้องจะเด้งเป็น <strong>สีเขียว (พร้อมขาย)</strong> ให้ฟรอนต์เห็นทันทีโดยไม่ต้องโทรบอก
          </div>
          <div class="img-card">
            <img src="${imgHousekeeping}" alt="แม่บ้านเดสก์ท็อป">
            <div class="img-caption">ภาพที่ 5: หน้ารายการงานทำความสะอาด</div>
          </div>
        </div>
      </div>

      <!-- POS Section -->
      <div class="section-title" style="margin-top: 10px;">
        <span class="role-badge badge-pos">ตำแหน่งที่ 3</span> แคชเชียร์ & ร้านอาหาร / มินิบาร์ (POS)
      </div>

      <div class="step-grid">
        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">การรับออเดอร์ & ผังโต๊ะ (/pos)</span>
          <div class="step-desc">
            • เลือกโต๊ะนั่ง (T1–T6) หรือเลือก "ซื้อกลับบ้าน"<br>
            • แตะเมนูอาหาร เครื่องดื่ม หรือขนมมินิบาร์ รายการจะเข้าตะกร้า<br>
            • ใช้งานได้ทั้งบนคอมพิวเตอร์และมือถือพนักงานเสิร์ฟ
          </div>
          <div class="img-card">
            <img src="${imgPos}" alt="POS ร้านอาหาร">
            <div class="img-caption">ภาพที่ 6: หน้าต่างสั่งอาหารและผังโต๊ะอาหาร</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">การคิดเงิน & สั่งลงบิลห้องพัก (Room Charge)</span>
          <div class="step-desc">
            • <strong>จ่ายทันที:</strong> เลือกเงินสด หรือ สแกน QR โอนเงิน<br>
            • <strong>ลงบิลห้องพัก:</strong> เลือก <em>"ลงบิลห้องพัก"</em> แล้วเลือกเลขห้อง (เช่น ห้อง 101) ยอดเงินจะส่งไปรวมกับบิลฟรอนต์อัตโนมัติ เพื่อคิดเงินตอนเช็คเอาต์
          </div>
          <div class="alert-box">
            💡 <strong>คำแนะนำ POS:</strong> หากแขกต้องการสั่งเครื่องดื่มมินิบาร์เพิ่ม สามารถใช้แท็บเล็ต/มือถือยิงบิลเข้าห้องพักได้ทันที
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>TheRoom Resort ชุมแพ • คู่มือระบบบริหารจัดการโรงแรม</span>
      <span>หน้า 2 จาก 3</span>
    </div>
  </div>

  <!-- ================= PAGE 3: METERS & MANAGER ================= -->
  <div class="page">
    <div>
      <div class="header-banner">
        <div class="header-left">
          <h1>TheRoom Resort ชุมแพ — คู่มือการใช้งานระบบ (SOP)</h1>
          <p>งานจดมิเตอร์น้ำ-ไฟ และผู้บริหาร/เจ้าของกิจการ (Owner / Manager)</p>
        </div>
        <div class="header-badge">หน้า 3 / 3 • จดมิเตอร์ & ผู้บริหาร</div>
      </div>

      <!-- Meters Section -->
      <div class="section-title">
        <span class="role-badge badge-meter">ตำแหน่งที่ 4</span> เจ้าหน้าที่จดมิเตอร์น้ำ-ไฟ (ห้องพักรายเดือน)
      </div>

      <div class="step-grid">
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">การบันทึกเลขอ่านมิเตอร์ (/meters)</span>
          <div class="step-desc">
            • จดมิเตอร์ทุกสิ้นเดือน หรือวันที่แขกรายเดือนย้ายออก<br>
            • กรอกเลขมิเตอร์ไฟ และมิเตอร์น้ำครั้งนี้<br>
            • <strong>ค่าไฟ:</strong> หน่วยละ 7 บาท | <strong>ค่าน้ำ:</strong> หน่วยละ 18 บาท<br>
            • ระบบจะคำนวณส่วนต่างยูนิตและส่งยอดไปรวมในบิลรายเดือนอัตโนมัติ
          </div>
          <div class="img-card">
            <img src="${imgMeters}" alt="จดมิเตอร์น้ำไฟ">
            <div class="img-caption">ภาพที่ 7: หน้าบันทึกเลขอ่านมิเตอร์น้ำ-ไฟ</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">คลังของใช้ & เบิกจ่าย (/supplies)</span>
          <div class="step-desc">
            • แม่บ้าน/ช่าง เบิกสบู่ แชมพู ทิชชู หลอดไฟ ผ้าปูที่นอน<br>
            • ระบุจำนวนชิ้นที่นำไปใช้ สต็อกกลางจะตัดยอดเรียลไทม์<br>
            • ป้องกันของใช้สูญหายและแจ้งเตือนเมื่อของใกล้หมด
          </div>
          <div class="img-card">
            <img src="${imgSupplies}" alt="คลังของใช้">
            <div class="img-caption">ภาพที่ 8: คลังของใช้และของในห้องพัก</div>
          </div>
        </div>
      </div>

      <!-- Owner & Manager Section -->
      <div class="section-title" style="margin-top: 10px;">
        <span class="role-badge badge-admin">ตำแหน่งที่ 5</span> เจ้าของกิจการ & ผู้จัดการ (Owner / Manager)
      </div>

      <div class="step-grid">
        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">รายงานสรุปยอดรายได้ (/reports)</span>
          <div class="step-desc">
            • ดูยอดรายรับสุทธิ สัดส่วน <strong>เงินสด vs เงินโอน</strong><br>
            • ตรวจสอบยอดขายห้องพัก, ยอดขาย POS, ยอดค้างชำระ<br>
            • ตรวจสอบยอดมัดจำกุญแจ (รับเข้า/คืน/ถือรอคืน)
          </div>
          <div class="img-card">
            <img src="${imgReports}" alt="รายงานยอดขาย">
            <div class="img-caption">ภาพที่ 9: แดชบอร์ดรายงานการเงินสรุปยอด</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">ตั้งค่าระบบ & ประวัติ Audit Log (/settings)</span>
          <div class="step-desc">
            • ปรับราคาห้องพัก, อัตราค่าน้ำ-ไฟ, ค่ามัดจำกุญแจ<br>
            • เพิ่ม/ลบบัญชีพนักงาน, อนุมัติรหัสผ่านกรณีพนักงานลืมรหัส<br>
            • <strong>Audit Log:</strong> บันทึกประวัติย้อนหลังว่าใครทำรายการอะไร ป้องกันการทุจริต 100%
          </div>
          <div class="img-card">
            <img src="${imgSettings}" alt="ตั้งค่าระบบ">
            <div class="img-caption">ภาพที่ 10: เมนูตั้งค่านโยบายและบัญชีผู้ใช้</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>TheRoom Resort ชุมแพ • คู่มือระบบบริหารจัดการโรงแรม</span>
      <span>หน้า 3 จาก 3</span>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, htmlContent, "utf-8");
console.log("HTML generated at:", outputHtmlPath);

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const command = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${outputHtmlPath}"`;

try {
  console.log("Compiling PDF with headless Chrome...");
  execSync(command, { stdio: "inherit" });
  if (fs.existsSync(outputPdfPath)) {
    const stat = fs.statSync(outputPdfPath);
    console.log(`PDF generated successfully! Size: ${(stat.size / 1024).toFixed(1)} KB`);
  } else {
    console.error("PDF file was not created.");
  }
} catch (err) {
  console.error("Error generating PDF:", err);
}
