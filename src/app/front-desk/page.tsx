import { AppShell } from "@/components/AppShell";
import { FrontDeskClient } from "@/components/FrontDeskClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { hasVoidPermission } from "@/lib/roles";

export default async function FrontDeskPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "ACCOUNTING",
  ], "/front-desk");

  const rooms = await prisma.room.findMany({
    include: {
      roomType: true,
      stays: {
        where: { status: { in: ["RESERVED", "CHECKED_IN"] } },
        include: { guest: true, folio: true },
        orderBy: { checkInDate: "asc" },
      },
    },
    orderBy: { roomNumber: "asc" },
  });
  const guests = await prisma.guest.findMany({
    select: { id: true, fullName: true, phone: true, idNumber: true, tag: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

  const serialized = rooms.map((r) => ({
    ...r,
    stays: r.stays.map((s) => ({
      id: s.id,
      bookingCode: s.bookingCode,
      stayType: s.stayType,
      status: s.status,
      checkInDate: s.checkInDate.toISOString(),
      checkOutDate: s.checkOutDate.toISOString(),
      rateAmount: s.rateAmount,
      securityDeposit: s.securityDeposit,
      keyDeposit: s.keyDeposit,
      keyDepositMethod: s.keyDepositMethod,
      keyDepositStatus: s.keyDepositStatus,
      keyDepositRefunded: s.keyDepositRefunded,
      guest: {
        id: s.guest.id,
        fullName: s.guest.fullName,
        phone: s.guest.phone,
        idNumber: s.guest.idNumber,
        tag: s.guest.tag,
      },
      folio: s.folio ? { id: s.folio.id, balance: s.folio.balance } : null,
    })),
  }));

  return (
    <AppShell user={user} hotelName={hotelName}>
      <FrontDeskClient
        initialRooms={serialized}
        initialGuests={guests}
        canVoid={hasVoidPermission(user.role, user.allowedMenus)}
        propertySetting={{
          hotelName: setting?.hotelName || hotelName,
          address: setting?.address || "",
          phone: setting?.phone || "",
          taxId: setting?.taxId || "",
          shortTimeRate: setting?.shortTimeRate ?? 400,
          shortTimeHours: setting?.shortTimeHours ?? 3,
          defaultKeyDeposit: setting?.defaultKeyDeposit ?? 200,
          enableShortTime: setting?.enableShortTime ?? true,
          enableMonthly: setting?.enableMonthly ?? true,
        }}
      />
    </AppShell>
  );
}
