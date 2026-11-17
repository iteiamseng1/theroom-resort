import { redirect } from "next/navigation";
import { getCurrentUser, SessionUser, UserRole } from "./auth";
import { resolveAllowedMenus } from "./roles";
import { prisma } from "./prisma";

let cachedHotelName: { name: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60s cache to avoid querying propertySetting on every page load

interface CachedDbUser {
  role: string;
  active: boolean;
  allowedMenus: string;
  name: string;
}

const userCache = new Map<string, { user: CachedDbUser; timestamp: number }>();

export function invalidateUserCache(userId?: string) {
  if (userId) userCache.delete(userId);
  else userCache.clear();
}

export function invalidateHotelNameCache() {
  cachedHotelName = null;
}

async function getCachedHotelName(): Promise<string> {
  const now = Date.now();
  if (cachedHotelName && now - cachedHotelName.timestamp < CACHE_TTL_MS) {
    return cachedHotelName.name;
  }
  try {
    const setting = await prisma.propertySetting.findUnique({
      where: { id: 1 },
      select: { hotelName: true },
    });
    const name = setting?.hotelName || "TheRoom Resort ชุมแพ";
    cachedHotelName = { name, timestamp: now };
    return name;
  } catch {
    return cachedHotelName?.name || "TheRoom Resort ชุมแพ";
  }
}

async function getCachedDbUser(id: string): Promise<CachedDbUser | null> {
  const now = Date.now();
  const cached = userCache.get(id);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.user;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, active: true, allowedMenus: true, name: true },
    });
    if (user) {
      userCache.set(id, { user, timestamp: now });
    }
    return user;
  } catch {
    return cached ? cached.user : null;
  }
}

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

  const [dbUser, hotelName] = await Promise.all([
    getCachedDbUser(sessionUser.id),
    getCachedHotelName(),
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
    hotelName,
  };
}
