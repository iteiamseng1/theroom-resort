import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearData() {
  console.log("==================================================");
  console.log("  TheRoom Resort - Database Reset & Data Purge   ");
  console.log("==================================================\n");

  console.log("Starting data purge inside a single transaction...");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete dependent order & payment data
    const supplyMovements = await tx.supplyMovement.deleteMany({});
    const posOrderItems = await tx.posOrderItem.deleteMany({});
    const payments = await tx.payment.deleteMany({});
    const posOrders = await tx.posOrder.deleteMany({});
    const folioItems = await tx.folioItem.deleteMany({});
    const folios = await tx.folio.deleteMany({});
    const utilityMeters = await tx.utilityMeter.deleteMany({});
    const housekeepingTasks = await tx.housekeepingTask.deleteMany({});
    const stays = await tx.stay.deleteMany({});
    const guests = await tx.guest.deleteMany({});
    const passwordResets = await tx.passwordResetRequest.deleteMany({});
    const auditLogs = await tx.auditLog.deleteMany({});

    // 2. Reset Inventory Stock to 0 (Keep items & categories intact)
    const menuItemsReset = await tx.menuItem.updateMany({
      data: { stockQty: 0 },
    });
    const supplyItemsReset = await tx.supplyItem.updateMany({
      data: { stockQty: 0 },
    });

    // 3. Reset Rooms to Vacant Clean (VC) & meters to 0
    const roomsReset = await tx.room.updateMany({
      data: {
        status: "VC",
        lastWaterMeter: 0,
        lastElectricMeter: 0,
      },
    });

    // 4. Reset Dining Tables to AVAILABLE
    const diningTablesReset = await tx.diningTable.updateMany({
      data: {
        status: "AVAILABLE",
      },
    });

    return {
      supplyMovements: supplyMovements.count,
      posOrderItems: posOrderItems.count,
      payments: payments.count,
      posOrders: posOrders.count,
      folioItems: folioItems.count,
      folios: folios.count,
      utilityMeters: utilityMeters.count,
      housekeepingTasks: housekeepingTasks.count,
      stays: stays.count,
      guests: guests.count,
      passwordResets: passwordResets.count,
      auditLogs: auditLogs.count,
      menuItemsReset: menuItemsReset.count,
      supplyItemsReset: supplyItemsReset.count,
      roomsReset: roomsReset.count,
      diningTablesReset: diningTablesReset.count,
    };
  });

  console.log("\n Purge & Reset Completed Successfully!");
  console.log("-----------------------------------------");
  console.log(`- ลบประวัติการเบิก/รับของ (SupplyMovements): ${result.supplyMovements} รายการ`);
  console.log(`- ลบประวัติชำระเงิน (Payments): ${result.payments} รายการ`);
  console.log(`- ลบรายการขาย POS (PosOrders & Items): ${result.posOrders} ออร์เดอร์ (${result.posOrderItems} รายการ)`);
  console.log(`- ลบบิล/โฟลิโอ (Folios & Items): ${result.folios} บิล (${result.folioItems} รายการ)`);
  console.log(`- ลบประวัติจดมิเตอร์น้ำไฟ (UtilityMeters): ${result.utilityMeters} รายการ`);
  console.log(`- ลบงานแม่บ้าน (HousekeepingTasks): ${result.housekeepingTasks} รายการ`);
  console.log(`- ลบประวัติการเข้าพัก (Stays): ${result.stays} รายการ`);
  console.log(`- ลบข้อมูลลูกค้า (Guests): ${result.guests} รายการ`);
  console.log(`- ลบคำขอรหัสผ่าน (PasswordResets): ${result.passwordResets} รายการ`);
  console.log(`- ลบประวัติการใช้งาน (AuditLogs): ${result.auditLogs} รายการ`);
  console.log(`- รีเซ็ตสต๊อกสินค้าเมนู (MenuItems) เป็น 0: ${result.menuItemsReset} รายการ`);
  console.log(`- รีเซ็ตสต๊อกของใช้/พัสดุ (SupplyItems) เป็น 0: ${result.supplyItemsReset} รายการ`);
  console.log(`- ปรับสถานะห้องพัก (Rooms) เป็นว่างพร้อมพัก (VC) ทั้งหมด: ${result.roomsReset} ห้อง`);
  console.log(`- ปรับสถานะโต๊ะอาหาร (DiningTables) เป็นว่างทั้งหมด: ${result.diningTablesReset} โต๊ะ`);

  // Verify settings & users still exist
  const settings = await prisma.propertySetting.findFirst();
  const users = await prisma.user.count();
  console.log("\n Preserved Core Settings:");
  console.log(`- ชื่อโรงแรมในระบบ: "${settings?.hotelName}"`);
  console.log(`- จำนวนบัญชีผู้ใช้ระบบ: ${users} บัญชี (คงเดิมทั้งหมด)`);
}

clearData()
  .catch((err) => {
    console.error("Purge Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
