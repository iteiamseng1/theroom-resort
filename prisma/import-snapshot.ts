import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(process.cwd(), "prisma", "seed-snapshot.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (data.propertySettings?.length) {
    await prisma.propertySetting.createMany({ data: data.propertySettings, skipDuplicates: true });
  }
  if (data.users?.length) {
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  }
  if (data.roomTypes?.length) {
    await prisma.roomType.createMany({ data: data.roomTypes, skipDuplicates: true });
  }
  if (data.rooms?.length) {
    await prisma.room.createMany({ data: data.rooms, skipDuplicates: true });
  }
  if (data.diningTables?.length) {
    await prisma.diningTable.createMany({ data: data.diningTables, skipDuplicates: true });
  }
  if (data.menuCategories?.length) {
    await prisma.menuCategory.createMany({ data: data.menuCategories, skipDuplicates: true });
  }
  if (data.menuItems?.length) {
    await prisma.menuItem.createMany({ data: data.menuItems, skipDuplicates: true });
  }
  if (data.stockCategories?.length) {
    await prisma.stockCategory.createMany({ data: data.stockCategories, skipDuplicates: true });
  }
  if (data.supplyItems?.length) {
    await prisma.supplyItem.createMany({ data: data.supplyItems, skipDuplicates: true });
  }

  console.log("Imported snapshot into PostgreSQL successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
