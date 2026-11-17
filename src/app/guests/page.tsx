import { AppShell } from "@/components/AppShell";
import { GuestsClient } from "@/components/GuestsClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function GuestsPage() {
  const { user, hotelName } = await requireSession(["OWNER", "MANAGER", "FRONT_DESK"], "/guests");
  const guests = await prisma.guest.findMany({
    include: {
      stays: {
        include: {
          room: true,
          folio: {
            select: {
              id: true,
              status: true,
              balance: true,
              totalCharges: true,
              totalPayments: true,
            },
          },
        },
        orderBy: { checkInDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

  const serializedGuests = guests.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    stays: g.stays.map((s) => ({
      id: s.id,
      bookingCode: s.bookingCode,
      stayType: s.stayType,
      status: s.status,
      checkInDate: s.checkInDate.toISOString(),
      checkOutDate: s.checkOutDate.toISOString(),
      room: { roomNumber: s.room.roomNumber },
      folio: s.folio,
    })),
  }));

  return (
    <AppShell user={user} hotelName={hotelName}>
      <GuestsClient
        initialGuests={serializedGuests}
        setting={
          setting ?? {
            hotelName: "TheRoom Resort ชุมแพ",
            taxId: "",
            address: "",
            phone: "",
          }
        }
      />
    </AppShell>
  );
}
