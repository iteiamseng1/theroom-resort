import { AppShell } from "@/components/AppShell";
import { HousekeepingClient } from "@/components/HousekeepingClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function HousekeepingPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "HOUSEKEEPING",
  ], "/housekeeping");

  const [tasks, rooms] = await Promise.all([
    prisma.housekeepingTask.findMany({
      include: { room: true },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    }),
    prisma.room.findMany({ orderBy: { roomNumber: "asc" } }),
  ]);

  const serialized = tasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  const initialDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });

  return (
    <AppShell user={user} hotelName={hotelName}>
      <HousekeepingClient
        initialTasks={serialized}
        rooms={rooms}
        initialDate={initialDate}
      />
    </AppShell>
  );
}
