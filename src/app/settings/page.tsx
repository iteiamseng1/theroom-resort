import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "@/components/SettingsClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function SettingsPage() {
  const { user, hotelName } = await requireSession(["OWNER", "MANAGER"], "/settings");

  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });
  const roomTypes = await prisma.roomType.findMany({ orderBy: { code: "asc" } });
  const rooms = await prisma.room.findMany({ include: { roomType: true }, orderBy: { roomNumber: "asc" } });
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      allowedMenus: true,
      active: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const resetRequests = await prisma.passwordResetRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, username: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={user} hotelName={hotelName}>
      <SettingsClient
        initialSetting={
          setting ?? {
            hotelName: "TheRoom Resort ชุมแพ",
            taxId: "",
            address: "",
            phone: "",
            vatRate: 7,
            serviceChargeRate: 0,
            waterRatePerUnit: 18,
            waterMinUnits: 0,
            electricRatePerUnit: 7,
            electricMinUnits: 0,
            checkInTime: "14:00",
            checkOutTime: "12:00",
            shortTimeRate: 400,
            shortTimeHours: 3,
            defaultKeyDeposit: 200,
            enableShortTime: true,
            enableMonthly: true,
          }
        }
        initialRoomTypes={roomTypes}
        initialRooms={rooms}
        initialUsers={users}
        initialResetRequests={resetRequests.map((r) => ({
          id: r.id,
          username: r.username,
          note: r.note,
          createdAt: r.createdAt.toISOString(),
          user: r.user,
        }))}
        currentUserRole={user.role}
      />
    </AppShell>
  );
}
