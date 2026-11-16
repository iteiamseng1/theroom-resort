import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";

export default async function RootRedirectPage() {
  const { user } = await requireSession();

  if (user.role === "OWNER" || user.role === "MANAGER") {
    redirect("/reports");
  }
  if (user.role === "HOUSEKEEPING") {
    redirect("/housekeeping");
  }
  if (user.role === "FRONT_DESK") {
    redirect("/front-desk");
  }
  if (user.allowedMenus && user.allowedMenus.length > 0) {
    const first = user.allowedMenus.find((m) => m !== "/");
    if (first) redirect(first);
  }
  redirect("/front-desk");
}
