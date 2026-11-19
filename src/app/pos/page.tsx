import { AppShell } from "@/components/AppShell";
import { PosClient } from "@/components/PosClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function PosPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "POS_CASHIER",
    "KITCHEN",
  ], "/pos");

  const categories = await prisma.menuCategory.findMany({
    include: { items: { where: { active: true }, orderBy: { name: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  const tables = await prisma.diningTable.findMany({ orderBy: { tableNumber: "asc" } });
  const activeStays = await prisma.stay.findMany({
    where: { status: "CHECKED_IN" },
    include: { room: true, guest: true },
    orderBy: { room: { roomNumber: "asc" } },
  });
  const orders = await prisma.posOrder.findMany({
    include: {
      table: true,
      stay: { include: { room: true, guest: true } },
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

  const serializedOrders = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <AppShell user={user} hotelName={hotelName}>
      <PosClient
        initialCategories={categories}
        initialTables={tables}
        initialStays={activeStays}
        initialOrders={serializedOrders}
        vatRate={setting?.vatRate ?? 7}
        serviceRate={setting?.serviceChargeRate ?? 0}
        userRole={user.role}
        propertySetting={{
          hotelName: setting?.hotelName || hotelName,
          address: setting?.address || "",
          phone: setting?.phone || "",
          taxId: setting?.taxId || "",
        }}
      />
    </AppShell>
  );
}
