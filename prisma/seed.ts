import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Property Settings
  await prisma.propertySetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      hotelName: "TheRoom Resort ชุมแพ",
      taxId: "0105560000001",
      address: "99/9 ถนนสุขุมวิท กรุงเทพฯ 10110",
      phone: "02-999-9999",
      vatRate: 7.0,
      serviceChargeRate: 0.0,
      waterRatePerUnit: 18.0,
      waterMinUnits: 5,
      electricRatePerUnit: 7.0,
      electricMinUnits: 0,
      checkInTime: "14:00",
      checkOutTime: "12:00",
    },
  });

  // 2. Demo Users
  const defaultHash = await bcrypt.hash("1234", 10);
  const adminHash = await bcrypt.hash("admin123", 10);

  const users = [
    { username: "admin", name: "ผู้จัดการทั่วไป (Owner)", passwordHash: adminHash, role: "OWNER" },
    { username: "frontdesk", name: "พนักงานต้อนรับ", passwordHash: defaultHash, role: "FRONT_DESK" },
    { username: "pos", name: "แคชเชียร์ห้องอาหาร", passwordHash: defaultHash, role: "POS_CASHIER" },
    { username: "kitchen", name: "หัวหน้าครัว", passwordHash: defaultHash, role: "KITCHEN" },
    { username: "housekeeping", name: "หัวหน้าแม่บ้าน", passwordHash: defaultHash, role: "HOUSEKEEPING" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  // 3. Room Types
  const roomTypesData = [
    {
      code: "STD",
      name: "Standard Room",
      baseDailyRate: 900,
      baseMonthlyRate: 7500,
      maxOccupancy: 2,
      description: "ห้องพักมาตรฐาน เตียงเดี่ยว/คู่ พร้อมแอร์และ Wi-Fi",
    },
    {
      code: "DLX",
      name: "Deluxe Room",
      baseDailyRate: 1400,
      baseMonthlyRate: 11000,
      maxOccupancy: 2,
      description: "ห้องกว้างพิเศษ พร้อมระเบียงและโซฟา",
    },
    {
      code: "MTH",
      name: "Monthly Studio",
      baseDailyRate: 1000,
      baseMonthlyRate: 6500,
      maxOccupancy: 2,
      description: "ห้องสตูดิโอรายเดือน พร้อมเฟอร์นิเจอร์และมิเตอร์แยก",
    },
    {
      code: "STE",
      name: "Executive Suite",
      baseDailyRate: 2400,
      baseMonthlyRate: 18000,
      maxOccupancy: 4,
      description: "ห้องสวีท 1 ห้องนอน 1 ห้องนั่งเล่น",
    },
  ];

  const roomTypes: Record<string, string> = {};
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.upsert({
      where: { code: rt.code },
      update: {},
      create: rt,
    });
    roomTypes[rt.code] = created.id;
  }

  // 4. Rooms (12 rooms across 3 floors)
  const roomsData = [
    { roomNumber: "101", floor: 1, zone: "Building A", roomTypeId: roomTypes.STD, status: "OC", lastWaterMeter: 120, lastElectricMeter: 1450 },
    { roomNumber: "102", floor: 1, zone: "Building A", roomTypeId: roomTypes.STD, status: "VC", lastWaterMeter: 85, lastElectricMeter: 980 },
    { roomNumber: "103", floor: 1, zone: "Building A", roomTypeId: roomTypes.STD, status: "VD", lastWaterMeter: 92, lastElectricMeter: 1120 },
    { roomNumber: "104", floor: 1, zone: "Building A", roomTypeId: roomTypes.DLX, status: "VC", lastWaterMeter: 44, lastElectricMeter: 610 },
    { roomNumber: "201", floor: 2, zone: "Building A", roomTypeId: roomTypes.DLX, status: "VC", lastWaterMeter: 150, lastElectricMeter: 2100 },
    { roomNumber: "202", floor: 2, zone: "Building A", roomTypeId: roomTypes.DLX, status: "OOO", notes: "ล้างแอร์ประจำปี", lastWaterMeter: 67, lastElectricMeter: 890 },
    { roomNumber: "203", floor: 2, zone: "Building A", roomTypeId: roomTypes.STE, status: "VC", lastWaterMeter: 30, lastElectricMeter: 540 },
    { roomNumber: "204", floor: 2, zone: "Building A", roomTypeId: roomTypes.STE, status: "VC", lastWaterMeter: 28, lastElectricMeter: 410 },
    { roomNumber: "301", floor: 3, zone: "Monthly Wing", roomTypeId: roomTypes.MTH, status: "OC", lastWaterMeter: 310, lastElectricMeter: 4200 },
    { roomNumber: "302", floor: 3, zone: "Monthly Wing", roomTypeId: roomTypes.MTH, status: "VC", lastWaterMeter: 205, lastElectricMeter: 2890 },
    { roomNumber: "303", floor: 3, zone: "Monthly Wing", roomTypeId: roomTypes.MTH, status: "VC", lastWaterMeter: 180, lastElectricMeter: 2450 },
    { roomNumber: "304", floor: 3, zone: "Monthly Wing", roomTypeId: roomTypes.MTH, status: "VC", lastWaterMeter: 95, lastElectricMeter: 1300 },
  ];

  for (const r of roomsData) {
    await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {},
      create: r,
    });
  }

  // 5. Menu Categories & Items (Restaurant POS + Minibar)
  const existingCategories = await prisma.menuCategory.count();
  if (existingCategories === 0) {
    const foodCat = await prisma.menuCategory.create({
      data: { name: "อาหารจานเดียว", station: "KITCHEN", sortOrder: 1 },
    });
    const drinkCat = await prisma.menuCategory.create({
      data: { name: "เครื่องดื่ม & กาแฟ", station: "BAR", sortOrder: 2 },
    });
    const minibarCat = await prisma.menuCategory.create({
      data: { name: "มินิบาร์ในห้องพัก", station: "MINIBAR", sortOrder: 3 },
    });

    await prisma.menuItem.createMany({
      data: [
        { categoryId: foodCat.id, name: "ข้าวผัดกุ้ง", price: 120, cost: 45, trackStock: false },
        { categoryId: foodCat.id, name: "ผัดกะเพราหมูสับไข่ดาว", price: 95, cost: 35, trackStock: false },
        { categoryId: foodCat.id, name: "ต้มยำกุ้งน้ำข้น", price: 180, cost: 70, trackStock: false },
        { categoryId: foodCat.id, name: "American Breakfast (ABF)", price: 150, cost: 55, trackStock: false },
        { categoryId: drinkCat.id, name: "อเมริกาโน่เย็น", price: 65, cost: 18, trackStock: false },
        { categoryId: drinkCat.id, name: "ชาไทยเย็น", price: 60, cost: 15, trackStock: false },
        { categoryId: minibarCat.id, name: "น้ำดื่ม (ขวด 600ml)", price: 20, cost: 5, stockQty: 120, trackStock: true, isMinibar: true },
        { categoryId: minibarCat.id, name: "โค้กกระป๋อง", price: 35, cost: 14, stockQty: 60, trackStock: true, isMinibar: true },
        { categoryId: minibarCat.id, name: "เบียร์สิงห์กระป๋อง", price: 75, cost: 38, stockQty: 48, trackStock: true, isMinibar: true },
        { categoryId: minibarCat.id, name: "มันฝรั่งทอดกรอบ", price: 40, cost: 18, stockQty: 40, trackStock: true, isMinibar: true },
      ],
    });
  }

  // 6. Dining Tables
  const tables = [
    { tableNumber: "T1", zone: "Indoor", seats: 2 },
    { tableNumber: "T2", zone: "Indoor", seats: 4 },
    { tableNumber: "T3", zone: "Indoor", seats: 4 },
    { tableNumber: "T4", zone: "Garden", seats: 6 },
    { tableNumber: "T5", zone: "Garden", seats: 4 },
    { tableNumber: "BAR1", zone: "Counter", seats: 2 },
  ];

  for (const t of tables) {
    await prisma.diningTable.upsert({
      where: { tableNumber: t.tableNumber },
      update: {},
      create: t,
    });
  }

  // 7. Sample Active Stays (1 Daily, 1 Monthly) if none exist
  const existingStays = await prisma.stay.count();
  if (existingStays === 0) {
    const room101 = await prisma.room.findUnique({ where: { roomNumber: "101" } });
    const room301 = await prisma.room.findUnique({ where: { roomNumber: "301" } });

    const guest1 = await prisma.guest.create({
      data: {
        fullName: "สมชาย ใจดี",
        phone: "081-234-5678",
        idType: "THAI_ID",
        idNumber: "1100100123456",
        nationality: "Thai",
        tag: "VIP",
        preferences: "ขอหมอนเพิ่ม 1 ใบ",
      },
    });

    const guest2 = await prisma.guest.create({
      data: {
        fullName: "วิภาดา รักสงบ",
        phone: "089-876-5432",
        idType: "THAI_ID",
        idNumber: "3100200654321",
        nationality: "Thai",
        vehiclePlate: "กข 1234 กทม",
      },
    });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (room101) {
      await prisma.stay.create({
        data: {
          bookingCode: "BK-2026-0001",
          stayType: "DAILY",
          status: "CHECKED_IN",
          roomId: room101.id,
          guestId: guest1.id,
          checkInDate: now,
          checkOutDate: tomorrow,
          actualCheckIn: now,
          rateAmount: 900,
          depositAmount: 500,
          adults: 2,
          folio: {
            create: {
              status: "OPEN",
              totalCharges: 1800,
              totalPayments: 500,
              balance: 1300,
              items: {
                create: [
                  {
                    category: "ROOM_CHARGE",
                    description: "ค่าห้องพัก 101 (2 คืน)",
                    quantity: 2,
                    unitPrice: 900,
                    amount: 1800,
                  },
                ],
              },
              payments: {
                create: [
                  {
                    amount: 500,
                    method: "TRANSFER",
                    referenceNo: "DEP-001",
                  },
                ],
              },
            },
          },
        },
      });
    }

    if (room301) {
      await prisma.stay.create({
        data: {
          bookingCode: "MT-2026-0001",
          stayType: "MONTHLY",
          status: "CHECKED_IN",
          roomId: room301.id,
          guestId: guest2.id,
          checkInDate: now,
          checkOutDate: nextMonth,
          actualCheckIn: now,
          rateAmount: 6500,
          depositAmount: 6500,
          securityDeposit: 6500,
          adults: 1,
          folio: {
            create: {
              status: "OPEN",
              totalCharges: 6500,
              totalPayments: 0,
              balance: 6500,
              items: {
                create: [
                  {
                    category: "ROOM_CHARGE",
                    description: "ค่าเช่าห้อง 301 ประจำเดือน",
                    quantity: 1,
                    unitPrice: 6500,
                    amount: 6500,
                  },
                ],
              },
            },
          },
        },
      });
    }
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
