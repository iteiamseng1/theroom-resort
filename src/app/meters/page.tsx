import { AppShell } from "@/components/AppShell";
import { MetersClient } from "@/components/MetersClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function MetersPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "HOUSEKEEPING",
    "ACCOUNTING",
  ]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [rooms, readings, setting] = await Promise.all([
    prisma.room.findMany({
      include: {
        stays: {
          where: { status: "CHECKED_IN" },
          include: { guest: true, folio: true },
          take: 1,
        },
      },
      orderBy: { roomNumber: "asc" },
    }),
    prisma.utilityMeter.findMany({
      where: { billingMonth: currentMonth },
    }),
    prisma.propertySetting.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <AppShell user={user} hotelName={hotelName}>
      <MetersClient
        initialRooms={rooms}
        initialReadings={readings}
        initialMonth={currentMonth}
        waterRate={setting?.waterRatePerUnit ?? 18}
        electricRate={setting?.electricRatePerUnit ?? 7}
      />
    </AppShell>
  );
}
