import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const outputHtmlPath = path.join(process.cwd(), "scripts", "manual-print.html");
const outputPdfPath = path.join(process.cwd(), "public", "manual-theroom-resort.pdf");

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คู่มือการใช้งานระบบ TheRoom Resort ชุมแพ</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
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
      font-size: 13px;
      line-height: 1.5;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header & Branding */
    .header-banner {
      background: linear-gradient(135deg, #2D160B 0%, #432313 100%);
      color: #FAF5EE;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #C89B35;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .resort-title {
      font-size: 20px;
      font-weight: 700;
      color: #F6DC93;
      margin: 0;
      letter-spacing: 0.3px;
    }

    .resort-sub {
      font-size: 12px;
      color: #EADFCF;
      margin-top: 2px;
    }

    .badge-doc {
      background: rgba(200, 155, 53, 0.25);
      border: 1px solid #C89B35;
      color: #F6DC93;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-align: right;
    }

    /* Section Styles */
    h2.section-title {
      font-size: 15px;
      font-weight: 700;
      color: #2D160B;
      border-left: 5px solid #C89B35;
      padding-left: 10px;
      margin: 14px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3.sub-title {
      font-size: 13px;
      font-weight: 600;
      color: #78350F;
      margin: 10px 0 6px 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 12px;
    }

    th {
      background: #FAF0DC;
      color: #432313;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #E6D9C2;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #EAE2D5;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #FAF8F5;
    }

    /* Card Boxes */
    .role-card {
      border: 1px solid #E6D9C2;
      border-radius: 10px;
      background: #FFFFFF;
      padding: 12px 14px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .role-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #F0E6D6;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .role-name {
      font-size: 14px;
      font-weight: 700;
      color: #2D160B;
    }

    .role-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-admin { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
    .badge-front { background: #E0F2FE; color: #075985; border: 1px solid #BAE6FD; }
    .badge-hk { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }

    /* Step Grid */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 10px;
    }

    .step-box {
      background: #FAF6EE;
      border: 1px solid #EADFCF;
      border-radius: 8px;
      padding: 9px 11px;
    }

    .step-num {
      display: inline-block;
      width: 20px;
      height: 20px;
      background: #C89B35;
      color: #FFFFFF;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
    }

    .step-title {
      font-weight: 700;
      font-size: 12px;
      color: #432313;
    }

    .step-desc {
      font-size: 11.5px;
      color: #554438;
      margin-top: 4px;
      line-height: 1.4;
    }

    /* Status Pills */
    .status-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      margin-right: 4px;
    }

    .status-vc { background: #D1FAE5; color: #065F46; }
    .status-oc { background: #E0F2FE; color: #075985; }
    .status-vd { background: #FEF3C7; color: #92400E; }
    .status-ooo { background: #FFE4E6; color: #9F1239; }

    /* Tip & Note Alert Box */
    .alert-box {
      background: #FDF8ED;
      border-left: 4px solid #C89B35;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 8px 0;
      font-size: 11.5px;
      color: #5C3A1E;
    }

    .footer {
      text-align: center;
      font-size: 10px;
      color: #8C7A6B;
      border-top: 1px solid #EADFCF;
      padding-top: 6px;
      margin-top: 14px;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="header-banner">
      <div class="header-left">
        <div>
          <div class="resort-title">TheRoom Resort ชุมแพ</div>
          <div class="resort-sub">คู่มือการใช้งานระบบบริหารโรงแรม, ที่พักรายเดือน & ห้องอาหาร POS</div>
        </div>
      </div>
      <div class="badge-doc">
        คู่มือปฏิบัติงาน (SOP)<br>ฉบับเข้าใจง่าย 2026
      </div>
    </div>

    <div class="alert-box">
      <strong>📌 ข้อมูลการเข้าสู่ระบบด่วน:</strong> สามารถเข้าใช้งานได้จากหน้าล็อกอินผ่านคอมพิวเตอร์ แท็บเล็ต หรือสมาร์ตโฟน (แนะนำเพิ่มไอคอนลงหน้าจอโฮม PWA เพื่อการทำงานที่รวดเร็ว)
    </div>

    <h2 class="section-title">1. ข้อมูลบัญชีผู้ใช้งานแยกตามตำแหน่ง (Login Accounts)</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">ตำแหน่งงาน</th>
          <th style="width: 20%;">ชื่อผู้ใช้ (Username)</th>
          <th style="width: 20%;">รหัสผ่าน</th>
          <th>อุปกรณ์ & สิทธิ์เมนูหลัก</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="role-badge badge-admin">เจ้าของ / ผู้จัดการ</span></td>
          <td><strong>admin</strong></td>
          <td><code>admin123</code></td>
          <td>คอมพิวเตอร์ / iPad (รายงานยอด, ตั้งค่าระบบ, สิทธิ์ผู้ใช้, สต๊อก)</td>
        </tr>
        <tr>
          <td><span class="role-badge badge-front">พนักงานต้อนรับ (Front)</span></td>
          <td><strong>frontdesk</strong></td>
          <td><code>1234</code></td>
          <td>คอมพิวเตอร์เคาน์เตอร์ (ผังห้อง 28 ห้อง, เช็คอิน/เอาต์, บิล, รับเงิน)</td>
        </tr>
        <tr>
          <td><span class="role-badge badge-hk">แม่บ้าน & ซ่อมบำรุง</span></td>
          <td><strong>housekeeping</strong></td>
          <td><code>1234</code></td>
          <td>สมาร์ตโฟน (รายการห้องทำความสะอาด, เบิกของใช้, แจ้งซ่อม)</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">2. บทบาทที่ 1: เจ้าของกิจการ & ผู้จัดการ (Owner / Manager)</h2>
    <div class="role-card">
      <div class="role-header">
        <span class="role-name">👑 หน้าที่หลัก: ควบคุมบริหาร ตรวจสอบยอดขาย และกำหนดนโยบาย</span>
        <span class="role-badge badge-admin">admin / admin123</span>
      </div>

      <div class="steps-grid">
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">รายงานสรุปยอดขาย (/reports)</span>
          <div class="step-desc">
            • ดูรายรับรวมประจำวัน / รายสัปดาห์ / รายเดือนแบบเรียลไทม์<br>
            • เช็คอัตราการเข้าพัก (Occupancy Rate) สัดส่วนรายวัน vs รายเดือน<br>
            • ตรวจสอบยอดค้างชำระของห้องพักที่ยังไม่ปิดบิล
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">ตั้งค่านโยบายที่พัก (/settings)</span>
          <div class="step-desc">
            • กำหนดราคาห้องพักรายวัน / ราคาชั่วคราว (เช่น 400.- / 3 ชม.)<br>
            • ตั้งอัตราค่าน้ำ (18.-) และค่าไฟ (7.-) ต่อหน่วยสำหรับห้องรายเดือน<br>
            • กำหนดเงินมัดจำกุญแจมาตรฐาน (200.-) และเวลาเช็คอิน-เช็คเอาต์
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">จัดการผู้ใช้งาน & อนุมัติรหัสผ่าน</span>
          <div class="step-desc">
            • เพิ่มหรือระงับบัญชีพนักงานที่ลาออก ป้องกันข้อมูลรั่วไหล<br>
            • อนุมัติคำขอรีเซ็ตรหัสผ่านของพนักงานที่ลืมรหัสในคลิกเดียว<br>
            • กำหนดสิทธิ์เมนูเฉพาะบุคคลตามตำแหน่งงาน
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">ตรวจสอบความโปร่งใส (Audit Log)</span>
          <div class="step-desc">
            • ดูประวัติการใช้งานระบบย้อนหลัง: ใครเปิดห้อง, ใครรับเงินสด<br>
            • ตรวจสอบว่ามีการแก้ไขบิลหรือยอดเงินผิดปกติหรือไม่ ป้องกันทุจริต 100%<br>
            • ควบคุมสต๊อกสินค้าและราคาทุนในคลังกลาง (/stock)
          </div>
        </div>
      </div>
    </div>

    <div class="footer">TheRoom Resort ชุมแพ — หน้า 1 จาก 2</div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <h2 class="section-title">3. บทบาทที่ 2: พนักงานต้อนรับ (Front Desk)</h2>
    <div class="role-card">
      <div class="role-header">
        <span class="role-name">🏨 หน้าที่หลัก: ให้บริการต้อนรับ เปิดห้องพัก คิดเงิน และเช็คเอาต์</span>
        <span class="role-badge badge-front">frontdesk / 1234</span>
      </div>

      <div style="margin-bottom: 8px;">
        <strong>การอ่านสีสถานะผังห้อง (28 ห้อง):</strong>
        <span class="status-pill status-vc">เขียว: ว่างพร้อมพัก (VC)</span>
        <span class="status-pill status-oc">ฟ้า: มีแขกพัก (OC)</span>
        <span class="status-pill status-vd">เหลือง: รอทำความสะอาด (VD)</span>
        <span class="status-pill status-ooo">แดง: ปิดซ่อม (OOO)</span>
      </div>

      <div class="steps-grid">
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">เปิดห้องพักใหม่ (Check-in)</span>
          <div class="step-desc">
            • คลิกห้อง <strong>สีเขียว (VC)</strong> เท่านั้น<br>
            • เลือกประเภท: รายวัน, ชั่วคราว (3 ชม.), หรือรายเดือน<br>
            • ใส่ชื่อ/เบอร์โทรลูกค้า (มีระบบแนะนำลูกค้าเก่าอัตโนมัติ)<br>
            • รับเงินค่าห้อง + มัดจำกุญแจ 200.- (เงินสด / QR) แล้วกดบันทึก
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">คิดเงิน & พิมพ์ใบเสร็จ (/billing)</span>
          <div class="step-desc">
            • คลิกดูบิลห้องพัก หรือเข้าเมนูรับชำระ<br>
            • เพิ่มค่าอาหาร/มินิบาร์เข้าบิลห้องได้ตลอดเวลา<br>
            • เมื่อรับเงินแล้ว สามารถกดรูปเครื่องพิมพ์เพื่อออกใบเสร็จรับเงินขนาด <strong>ครึ่ง A4 (A5 แนวนอน)</strong> ได้ทันที
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">การย้ายห้อง & ต่อเวลา</span>
          <div class="step-desc">
            • <strong>ย้ายห้อง:</strong> คลิกห้องเดิม -> กด "ย้ายห้อง" -> เลือกห้องว่างปลายทาง (บิลและประวัติจะย้ายตามไปทั้งหมด)<br>
            • <strong>ต่อเวลาพัก:</strong> คลิกห้อง -> กด "ต่อเวลาพัก" เพื่อขยายคืนพัก
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">ขั้นตอนการเช็คเอาต์ (Check-out)</span>
          <div class="step-desc">
            • แขกคืนกุญแจ -> คลิกห้อง -> กด "ดำเนินการ Check-out"<br>
            • กดปุ่ม <strong>"คืนเงินมัดจำกุญแจ [200.-]"</strong> ให้ลูกค้า<br>
            • กดยืนยัน ห้องจะกลายเป็น <strong>สีเหลือง (VD)</strong> เพื่อส่งงานให้แม่บ้านทันที
          </div>
        </div>
      </div>
    </div>

    <h2 class="section-title">4. บทบาทที่ 3: แผนกแม่บ้าน & ซ่อมบำรุง (Housekeeping)</h2>
    <div class="role-card">
      <div class="role-header">
        <span class="role-name">🧹 หน้าที่หลัก: จัดการความสะอาดและเตรียมความพร้อมห้องพักผ่านมือถือ</span>
        <span class="role-badge badge-hk">housekeeping / 1234</span>
      </div>

      <div class="steps-grid">
        <div class="step-box">
          <span class="step-num">1</span><span class="step-title">เปิดดูงานบนมือถือ (/housekeeping)</span>
          <div class="step-desc">
            • แม่บ้านล็อกอินผ่านมือถือ จะเห็นรายการห้องที่แขกเช็คเอาต์แล้วทันที<br>
            • เดินไปที่ห้อง -> กดปุ่ม <strong>"เริ่มทำความสะอาด"</strong> บนการ์ดห้อง เพื่อแจ้งฟรอนต์ว่ากำลังเข้าทำ
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">2</span><span class="step-title">ตรวจเช็คห้อง & มินิบาร์</span>
          <div class="step-desc">
            • เช็คว่ามีขวดน้ำอัดลมหรือขนมมินิบาร์ถูกเปิดทานหรือไม่<br>
            • หากมี แจ้งฟรอนต์ทันทีเพื่อเก็บเงินก่อนแขกออกจากเคาน์เตอร์<br>
            • ตรวจสอบสิ่งของชำรุด หรือของที่แขกลืมไว้
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">3</span><span class="step-title">กดเสร็จสิ้น ห้องพร้อมขายทันที!</span>
          <div class="step-desc">
            • เมื่อทำความสะอาด ปูเตียง เติมของใช้เสร็จเรียบร้อย<br>
            • กดปุ่ม <strong>"ทำความสะอาดเสร็จแล้ว" (เครื่องหมายถูก)</strong><br>
            • <strong>ห้องจะเด้งเป็น สีเขียว (VC) บนหน้าจอของฟรอนต์ทันที</strong> โดยไม่ต้องโทรบอกกัน!
          </div>
        </div>

        <div class="step-box">
          <span class="step-num">4</span><span class="step-title">การเบิกของใช้ (/supplies)</span>
          <div class="step-desc">
            • เข้าเมนู "เบิกของใช้" เลือกสบู่ แชมพู ทิชชู น้ำดื่ม ผ้าปูที่นอน<br>
            • ระบุจำนวนที่นำไปใช้ สต๊อกกลางจะถูกตัดยอดอัตโนมัติ<br>
            • หากพบจุดชำรุด (แอร์/น้ำ) ให้แจ้งฟรอนต์ตั้งสถานะเป็นสีแดง (OOO)
          </div>
        </div>
      </div>
    </div>

    <div class="alert-box" style="margin-top: 10px;">
      💡 <strong>คำแนะนำหน้างาน:</strong> หากพนักงานคนใดลืมรหัสผ่าน ให้กดปุ่ม <em>"ลืมรหัสผ่าน?"</em> ที่หน้าแรก เพื่อส่งคำขอให้ผู้จัดการอนุมัติรหัสใหม่ได้ตลอด 24 ชั่วโมง
    </div>

    <div class="footer">TheRoom Resort ชุมแพ — หน้า 2 จาก 2 • เอกสารคู่มือระบบบริหารงานโรงแรม</div>
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
