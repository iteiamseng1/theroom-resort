import { AppShell } from "@/components/AppShell";
import { SuppliesClient } from "@/components/SuppliesClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function SuppliesPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "HOUSEKEEPING",
  ], "/supplies");

  const [items, movements, rooms] = await Promise.all([
    prisma.supplyItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.supplyMovement.findMany({
      include: { supplyItem: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.room.findMany({
      select: { roomNumber: true },
      orderBy: { roomNumber: "asc" },
    }),
  ]);

  const serializedMovements = movements.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <AppShell user={user} hotelName={hotelName}>
      <SuppliesClient
        initialItems={items}
        initialMovements={serializedMovements}
        roomNumbers={rooms.map((r) => r.roomNumber)}
      />
    </AppShell>
  );
}
