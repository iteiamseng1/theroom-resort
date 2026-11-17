import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("=== Checking Database Connection & Counts ===");

  const guests = await prisma.guest.count();
  const stays = await prisma.stay.count();
  const folios = await prisma.folio.count();
  const folioItems = await prisma.folioItem.count();
  const payments = await prisma.payment.count();
  const posOrders = await prisma.posOrder.count();
  const posOrderItems = await prisma.posOrderItem.count();
  const housekeeping = await prisma.housekeepingTask.count();
  const utilityMeters = await prisma.utilityMeter.count();
  const supplyMovements = await prisma.supplyMovement.count();
  const passwordResets = await prisma.passwordResetRequest.count();
  const auditLogs = await prisma.auditLog.count();

  const rooms = await prisma.room.count();
  const roomTypes = await prisma.roomType.count();
  const users = await prisma.user.count();
  const menuCategories = await prisma.menuCategory.count();
  const menuItems = await prisma.menuItem.count();
  const stockCategories = await prisma.stockCategory.count();
  const supplyItems = await prisma.supplyItem.count();
  const diningTables = await prisma.diningTable.count();
  const settings = await prisma.propertySetting.count();

  console.log("\n--- Tables to be CLEARED ---");
  console.log(`Guests: ${guests}`);
  console.log(`Stays: ${stays}`);
  console.log(`Folios: ${folios}`);
  console.log(`FolioItems: ${folioItems}`);
  console.log(`Payments: ${payments}`);
  console.log(`PosOrders: ${posOrders}`);
  console.log(`PosOrderItems: ${posOrderItems}`);
  console.log(`HousekeepingTasks: ${housekeeping}`);
  console.log(`UtilityMeters: ${utilityMeters}`);
  console.log(`SupplyMovements: ${supplyMovements}`);
  console.log(`PasswordResetRequests: ${passwordResets}`);
  console.log(`AuditLogs: ${auditLogs}`);

  console.log("\n--- Tables to be PRESERVED ---");
  console.log(`Rooms: ${rooms} (will reset status to VC, meters to 0)`);
  console.log(`RoomTypes: ${roomTypes}`);
  console.log(`Users: ${users}`);
  console.log(`MenuCategories: ${menuCategories}`);
  console.log(`MenuItems: ${menuItems} (will reset stockQty to 0)`);
  console.log(`StockCategories: ${stockCategories}`);
  console.log(`SupplyItems: ${supplyItems} (will reset stockQty to 0)`);
  console.log(`DiningTables: ${diningTables} (will reset status to AVAILABLE)`);
  console.log(`PropertySettings: ${settings}`);
}

main()
  .catch((err) => {
    console.error("Error executing query:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
