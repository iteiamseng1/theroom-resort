import { AppShell } from "@/components/AppShell";
import { StockClient } from "@/components/StockClient";
import { buildUnifiedStockPayload } from "@/app/api/stock/route";
import { requireSession } from "@/lib/require-session";

export default async function StockPage() {
  const { user, hotelName } = await requireSession([
    "OWNER",
    "MANAGER",
    "FRONT_DESK",
    "POS_CASHIER",
    "HOUSEKEEPING",
  ], "/stock");

  const { items, menuCategories, stockCategories } = await buildUnifiedStockPayload();

  return (
    <AppShell user={user} hotelName={hotelName}>
      <StockClient
        initialItems={items}
        menuCategories={menuCategories}
        stockCategories={stockCategories}
        hotelName={hotelName}
      />
    </AppShell>
  );
}
