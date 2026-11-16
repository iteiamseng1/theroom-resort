import { redirect } from "next/navigation";
import { getCurrentUser, SessionUser, UserRole } from "./auth";
import { resolveAllowedMenus } from "./roles";
import { prisma } from "./prisma";

export async function requireSession(
  allowedRoles?: UserRole[],
  requiredPath?: string
): Promise<{
  user: SessionUser;
  hotelName: string;
}> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/login");
  }

  const [dbUser, setting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true, active: true, allowedMenus: true, name: true },
    }),
    prisma.propertySetting.findUnique({ where: { id: 1 } }),
  ]);

  if (!dbUser || !dbUser.active) {
    redirect("/login");
  }

  const effectiveRole = dbUser.role as UserRole;
  const effectiveMenus = resolveAllowedMenus(effectiveRole, dbUser.allowedMenus);

  if (requiredPath) {
    if (!effectiveMenus.includes(requiredPath)) {
      const fallback = effectiveMenus[0] && effectiveMenus[0] !== requiredPath ? effectiveMenus[0] : "/";
      redirect(fallback);
    }
  } else if (allowedRoles && !dbUser.allowedMenus && !allowedRoles.includes(effectiveRole)) {
    redirect("/");
  }

  return {
    user: {
      ...sessionUser,
      name: dbUser.name,
      role: effectiveRole,
      allowedMenus: effectiveMenus,
    },
    hotelName: setting?.hotelName || "TheRoom Resort ชุมแพ",
  };
}
