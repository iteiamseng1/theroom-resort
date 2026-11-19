import { prisma } from "@/lib/prisma";
import { hasVoidPermission, resolveAllowedMenus, UserRole } from "@/lib/roles";

/** Checks in DB whether the user currently holds the "ยกเลิก" permission. */
export async function verifyVoidPermission(userId: string): Promise<boolean> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, allowedMenus: true, active: true },
  });
  if (!dbUser || !dbUser.active) return false;
  const allowedMenus = resolveAllowedMenus(dbUser.role as UserRole, dbUser.allowedMenus);
  return hasVoidPermission(dbUser.role, allowedMenus);
}
