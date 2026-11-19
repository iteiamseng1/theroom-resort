import { AppShell } from "@/components/AppShell";
import { ReceivingClient } from "@/components/ReceivingClient";
import { buildUnifiedStockPayload, getReceivingHistory } from "@/app/api/stock/route";
import { requireSession } from "@/lib/require-session";
import { hasVoidPermission } from "@/lib/roles";

export default async function ReceivingPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "POS_CASHIER",
    "HOUSEKEEPING",
  ], "/receiving");

  const [{ items }, history] = await Promise.all([
    buildUnifiedStockPayload(),
    getReceivingHistory(),
  ]);

  return (
    <AppShell user={user} hotelName={hotelName}>
      <ReceivingClient
        initialItems={items}
        initialHistory={history}
        hotelName={hotelName}
        canVoid={hasVoidPermission(user.role, user.allowedMenus)}
      />
    </AppShell>
  );
}
