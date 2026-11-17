import { AppShell } from "@/components/AppShell";
import { BillingClient } from "@/components/BillingClient";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ folioId?: string }>;
}) {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "ACCOUNTING",
  ], "/billing");
  const params = await searchParams;

  const folios = await prisma.folio.findMany({
    include: {
      stay: {
        include: {
          room: true,
          guest: true,
        },
      },
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const setting = await prisma.propertySetting.findUnique({ where: { id: 1 } });

  const serialized = folios.map((f) => ({
    ...f,
    items: f.items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    payments: f.payments.map((p) => ({ ...p, paidAt: p.paidAt.toISOString() })),
  }));

  return (
    <AppShell user={user} hotelName={hotelName}>
      <BillingClient
        initialFolios={serialized}
        initialSelectedId={params.folioId}
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
