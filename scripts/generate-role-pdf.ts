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
const imgSupplies = getBase64Image("08-supplies.png");
const imgReports = getBase64Image("09-reports.png");
const imgSettings = getBase64Image("10-settings.png");

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คู่มือการปฏิบัติงานระบบ TheRoom Resort ชุมแพ</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm 11mm 8mm 11mm;
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
      font-size: 11px;
      line-height: 1.35;
    }

    .page {
      page-break-after: always;
      position: relative;
      height: 279mm;
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
      padding: 10px 14px;
      border-radius: 9px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #C89B35;
    }

    .header-left h1 {
      margin: 0 0 2px 0;
      font-size: 16px;
      font-weight: 700;
      color: #F6DC93;
    }

    .header-left p {
      margin: 0;
      font-size: 10px;
      color: #EADFCF;
    }

    .header-badge {
      background: rgba(200, 155, 53, 0.25);
      border: 1px solid #C89B35;
      color: #F6DC93;
      padding: 3px 8px;
      border-radius: 16px;
      font-size: 9.5px;
      font-weight: 600;
    }

    /* Section & Cards */
    .section-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #2D160B;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #E6D9C2;
      padding-bottom: 3px;
    }

    .role-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      color: #fff;
    }
    .badge-front { background: #0284c7; }
    .badge-hk { background: #059669; }
    .badge-pos { background: #d97706; }
    .badge-admin { background: #e11d48; }

    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .account-card {
      border: 1px solid #E2D5BE;
      border-radius: 7px;
      padding: 5px 8px;
      background: #FAF6EE;
      font-size: 10px;
    }

    .account-card strong {
      color: #2D160B;
    }

    .step-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 6px;
    }

    .step-box {
      border: 1px solid #E5E7EB;
      border-radius: 7px;
      padding: 6px 8px;
      background: #F9FAFB;
    }

    .step-num {
      display: inline-block;
      width: 17px;
      height: 17px;
      line-height: 17px;
      text-align: center;
      background: #2D160B;
      color: #F6DC93;
      border-radius: 50%;
      font-size: 9.5px;
      font-weight: 700;
      margin-right: 4px;
    }

    .step-title {
      font-weight: 700;
      color: #111827;
      font-size: 10.5px;
    }

    .step-desc {
      font-size: 9.5px;
      color: #4B5563;
      margin-top: 2px;
      line-height: 1.3;
    }

    .img-card {
      border: 1px solid #D1D5DB;
      border-radius: 5px;
      overflow: hidden;
      background: #FFFFFF;
      margin-top: 3px;
      text-align: center;
    }

    .img-card img {
      width: 100%;
      height: 105px;
      object-fit: cover;
      display: block;
    }

    .img-caption {
      font-size: 8.5px;
      color: #4B5563;
      padding: 2px 5px;
      background: #F3F4F6;
      border-top: 1px solid #E5E7EB;
      font-weight: 600;
    }

    .color-legend {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      margin-bottom: 6px;
    }

    .legend-item {
      padding: 3px 5px;
      border-radius: 5px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
    }
    .leg-vc { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
    .leg-oc { background: #E0F2FE; color: #075985; border: 1px solid #7DD3FC; }
    .leg-vd { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
    .leg-ooo { background: #FFE4E6; color: #9F1239; border: 1px solid #FDA4AF; }

    .alert-box {
      background: #FFFBEB;
      border-left: 2.5px solid #F59E0B;
      padding: 4px 8px;
      font-size: 9.5px;
      color: #92400E;
      border-radius: 4px;
      margin-top: 4px;
    }

    .footer {
      border-top: 1px solid #E5E7EB;
      padding-top: 4px;
      font-size: 8.5px;
      color: #9CA3AF;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: FRONT DESK (INCLUDING SUPPLIES) ================= -->
  <div class="page">
    <div>
      <div class="header-banner">
        <div class="header-left">
          <h1>TheRoom Resort ชุมแพ — คู่มือการปฏิบัติงานระบบ (SOP)</h1>
          <p>ระบบบริหารโรงแรม & ห้องอาหาร POS (ห้องพักรายวัน 450.-/คืน)</p>
        </div>
        <div class="header-badge">หน้า 1 / 2 • พนักงานต้อนรับ & เบิกของใช้</div>
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
            • ตรวจดูห้องว่างแบบเรียลไทม์ โซน 1 (101–106) และ โซน 2 (201–206)<br>
            • ราคามาตรฐาน <strong>450 บาท/คืน</strong> ทุกห้อง
          </div>
          <div class="img-card">
            <img src="${imgFrontDesk}" alt="ผังห้องพัก">
            <div class="img-caption">ภาพที่ 1: ผังห้องพัก 28 ห้องแบบเรียลไทม์</div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">การเปิดห้องพักรายวัน (Check-in)</span>
          <div class="step-desc">
            • คลิกห้อง <strong>สีเขียว (VC)</strong> ใส่ชื่อและเบอร์โทรลูกค้า<br>
            • ระบบคิดค่าห้อง 450.- + <strong>มัดจำกุญแจ 200.-</strong> (รวม 650.-) ให้อัตโนมัติ<br>
            • เลือกว่ารับเงินสด หรือ สแกน QR แล้วกดยืนยันเปิดห้อง
          </div>
          <div class="img-card">
            <img src="${imgCheckinModal}" alt="หน้าต่างเช็คอิน">
            <div class="img-caption">ภาพที่ 2: ป๊อปอัปเปิดห้องพักรายวัน</div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">การคิดเงิน & พิมพ์ใบเสร็จ (/billing)</span>
          <div class="step-desc">
            • เข้าเมนู "รับชำระ" ตรวจสอบรายการบิลแต่ละห้อง<br>
            • กดไอคอนเครื่องพิมพ์เพื่อออกใบเสร็จขนาด <strong>ครึ่ง A4 (A5 แนวนอน)</strong><br>
            • มีหัวบิล TheRoom Resort ชุมแพ โทร. 098-1032870 ครบถ้วน
          </div>
          <div class="img-card">
            <img src="${imgBilling}" alt="หน้ารับชำระ">
            <div class="img-caption">ภาพที่ 3: เมนูรับชำระเงินและออกใบเสร็จ A5</div>
          </div>
        </div>

        <!-- Step 4 & 5 Combined -->
        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">การเช็คเอาต์ & คืนมัดจำกุญแจ</span>
          <div class="step-desc">
            • แขกคืนกุญแจ → คลิกห้องสีฟ้า → กด <strong>"ดำเนินการ Check-out"</strong><br>
            • กดปุ่มคืนมัดจำกุญแจ [200.-] → กดยืนยัน ห้องกลายเป็น <strong>สีเหลือง (รอแม่บ้าน)</strong>
          </div>
          <div class="alert-box">
            ⚠️ <strong>ข้อควรระวัง:</strong> อย่าลืมคืนเงินมัดจำกุญแจ 200 บาทให้แขกก่อนกดยืนยันเช็คเอาต์ทุกครั้ง
          </div>

          <div style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed #D1D5DB;">
            <span class="step-num" style="background:#0284c7;">5</span><span class="step-title" style="color:#0284c7;">การเบิกของใช้ & ผ้าปูที่นอน (/supplies)</span>
            <div class="step-desc">
              • <strong>หน้าที่ฟรอนต์ตามสิทธิ์:</strong> บันทึกการเบิกสบู่ แชมพู ทิชชู น้ำดื่ม ผ้าปูที่นอน ปลอกหมอน จ่ายให้แม่บ้านนำไปเติมในห้อง<br>
              • ระบุจำนวนชิ้น ระบบจะตัดสต็อกกลางอัตโนมัติ
            </div>
            <div class="img-card" style="margin-top: 4px;">
              <img src="${imgSupplies}" alt="คลังของใช้" style="height: 60px;">
              <div class="img-caption">ภาพที่ 4: ฟรอนต์เป็นผู้เบิกของใช้ & ผ้าปูที่นอนตามสิทธิ์</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>TheRoom Resort ชุมแพ • คู่มือระบบบริหารจัดการโรงแรม</span>
      <span>หน้า 1 จาก 2</span>
    </div>
  </div>

  <!-- ================= PAGE 2: HOUSEKEEPING, POS & MANAGER ================= -->
  <div class="page">
    <div>
      <div class="header-banner">
        <div class="header-left">
          <h1>TheRoom Resort ชุมแพ — คู่มือการใช้งานระบบ (SOP)</h1>
          <p>แผนกแม่บ้าน & ซ่อมบำรุง, ร้านอาหาร/มินิบาร์ POS และผู้บริหาร</p>
        </div>
        <div class="header-badge">หน้า 2 / 2 • แม่บ้าน • POS • ผู้บริหาร</div>
      </div>

      <!-- Housekeeping Section -->
      <div class="section-title">
        <span class="role-badge badge-hk">ตำแหน่งที่ 2</span> แผนกแม่บ้าน & ซ่อมบำรุง (Housekeeping)
      </div>

      <div class="step-grid">
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">ดูคิวทำความสะอาดบนมือถือ (/housekeeping)</span>
          <div class="step-desc">
            • ล็อกอิน <strong>housekeeping / 1234</strong> บนมือถือ ห้องที่เช็คเอาต์จะขึ้นเป็นสีเหลืองทันที<br>
            • เดินไปถึงห้อง กดปุ่มไอคอนเล่น ▶️ เพื่อแจ้งว่า <em>"กำลังทำความสะอาด"</em><br>
            • ตรวจเช็คสิ่งของมินิบาร์ และความเสียหายในห้อง หากพบให้แจ้งฟรอนต์ทันที
          </div>
          <div class="img-card">
            <img src="${imgMobileHk}" alt="แม่บ้านมือถือ">
            <div class="img-caption">ภาพที่ 5: หน้าจอแม่บ้านบนสมาร์ทโฟน</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">กดเสร็จสิ้น ห้องเด้งพร้อมขายทันที (VC)</span>
          <div class="step-desc">
            • ทำความสะอาดเสร็จ ปูเตียงเรียบร้อย กดปุ่มเครื่องหมายถูก ✔️<br>
            • ห้องจะเด้งเป็น <strong>สีเขียว (พร้อมขาย VC)</strong> ให้ฟรอนต์เห็นบนหน้าจอทันทีโดยไม่ต้องโทรบอก<br>
            • หากต้องการของใช้/ผ้าปูเพิ่ม ให้แจ้งพนักงานต้อนรับ (ฟรอนต์) ทำการเบิกจ่ายให้
          </div>
          <div class="img-card">
            <img src="${imgHousekeeping}" alt="แม่บ้านเดสก์ท็อป">
            <div class="img-caption">ภาพที่ 6: หน้ารายการห้องรอทำความสะอาด</div>
          </div>
        </div>
      </div>

      <!-- POS Section -->
      <div class="section-title" style="margin-top: 6px;">
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
            <div class="img-caption">ภาพที่ 7: หน้าต่างสั่งอาหารและผังโต๊ะอาหาร</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">การคิดเงิน & สั่งลงบิลห้องพัก (Room Charge)</span>
          <div class="step-desc">
            • <strong>จ่ายทันที:</strong> เลือกเงินสด หรือ สแกน QR โอนเงิน<br>
            • <strong>ลงบิลห้องพัก:</strong> เลือก <em>"ลงบิลห้องพัก"</em> แล้วเลือกเลขห้อง (เช่น ห้อง 101) ยอดเงินจะส่งไปรวมกับบิลฟรอนต์อัตโนมัติ เพื่อคิดเงินตอนเช็คเอาต์
          </div>
          <div class="alert-box">
            💡 <strong>คำแนะนำ POS:</strong> สามารถใช้แท็บเล็ต/มือถือยิงบิลเครื่องดื่มเข้าห้องพักได้สะดวกรวดเร็ว
          </div>
        </div>
      </div>

      <!-- Owner & Manager Section -->
      <div class="section-title" style="margin-top: 6px;">
        <span class="role-badge badge-admin">ตำแหน่งที่ 4</span> เจ้าของกิจการ & ผู้จัดการ (Owner / Manager)
      </div>

      <div class="step-grid">
        <div class="step-box">
          <span class="step-num">5</span><span class="step-title">รายงานสรุปยอดรายได้ (/reports)</span>
          <div class="step-desc">
            • ดูยอดรายรับสุทธิ สัดส่วน <strong>เงินสด vs เงินโอน</strong><br>
            • ตรวจสอบยอดขายห้องพัก, ยอดขาย POS, ยอดมัดจำกุญแจ (รับเข้า/คืน/ถือรอคืน)
          </div>
          <div class="img-card">
            <img src="${imgReports}" alt="รายงานยอดขาย">
            <div class="img-caption">ภาพที่ 8: แดชบอร์ดรายงานการเงินสรุปยอด</div>
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">6</span><span class="step-title">ตั้งค่าระบบ & ประวัติ Audit Log (/settings)</span>
          <div class="step-desc">
            • ปรับราคาห้องพักรายวัน, ข้อมูลรีสอร์ท, ค่ามัดจำกุญแจ<br>
            • เพิ่ม/ลบบัญชีพนักงาน, อนุมัติรหัสผ่านกรณีพนักงานลืมรหัส<br>
            • <strong>Audit Log:</strong> บันทึกประวัติย้อนหลังว่าใครทำรายการอะไร ป้องกันการทุจริต 100%
          </div>
          <div class="img-card">
            <img src="${imgSettings}" alt="ตั้งค่าระบบ">
            <div class="img-caption">ภาพที่ 9: เมนูตั้งค่านโยบายและบัญชีผู้ใช้</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>TheRoom Resort ชุมแพ • คู่มือระบบบริหารจัดการโรงแรม</span>
      <span>หน้า 2 จาก 2</span>
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
