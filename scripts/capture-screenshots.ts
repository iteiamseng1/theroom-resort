import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { createSessionToken } from "../src/lib/auth";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "public", "manual-images");

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const token = createSessionToken({
    id: "cmwebedhu00005fygd9hn1lw5",
    username: "admin",
    role: "OWNER",
    name: "ผู้จัดการทั่วไป (Owner)",
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  // 1. Login page (no cookie)
  console.log("Capturing 01-login.png...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01-login.png") });

  // Set auth cookie
  await page.setCookie({
    name: "theroom_session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
  });

  // 2. Front Desk page
  console.log("Capturing 02-frontdesk.png...");
  await page.goto(`${BASE_URL}/front-desk`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02-frontdesk.png") });

  // 3. Open Check-in Modal by clicking Room 101
  console.log("Capturing 03-checkin-modal.png...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const room101 = buttons.find((b) => b.textContent?.includes("101") && b.textContent?.includes("ว่าง"));
    if (room101) room101.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "03-checkin-modal.png") });
  // Close modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const closeBtn = buttons.find((b) => b.textContent?.includes("ยกเลิก") || b.textContent?.includes("✕") || b.textContent?.includes("ปิด"));
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. Billing page
  console.log("Capturing 04-billing.png...");
  await page.goto(`${BASE_URL}/billing`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "04-billing.png") });

  // 5. POS / Restaurant page
  console.log("Capturing 05-pos.png...");
  await page.goto(`${BASE_URL}/pos`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "05-pos.png") });

  // 6. Housekeeping page
  console.log("Capturing 06-housekeeping.png...");
  await page.goto(`${BASE_URL}/housekeeping`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "06-housekeeping.png") });

  // 7. Meters page
  console.log("Capturing 07-meters.png...");
  await page.goto(`${BASE_URL}/meters`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "07-meters.png") });

  // 8. Supplies page
  console.log("Capturing 08-supplies.png...");
  await page.goto(`${BASE_URL}/supplies`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "08-supplies.png") });

  // 9. Reports page
  console.log("Capturing 09-reports.png...");
  await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "09-reports.png") });

  // 10. Settings page
  console.log("Capturing 10-settings.png...");
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "10-settings.png") });

  // Also capture Mobile layout for Front Desk & POS
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  console.log("Capturing 11-mobile-frontdesk.png...");
  await page.goto(`${BASE_URL}/front-desk`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "11-mobile-frontdesk.png") });

  console.log("Capturing 12-mobile-pos.png...");
  await page.goto(`${BASE_URL}/pos`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "12-mobile-pos.png") });

  console.log("Capturing 13-mobile-housekeeping.png...");
  await page.goto(`${BASE_URL}/housekeeping`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "13-mobile-housekeeping.png") });

  await browser.close();
  console.log("All screenshots captured successfully in:", OUTPUT_DIR);
}

capture().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
