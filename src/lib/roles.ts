export type UserRole =
  | "OWNER"
  | "MANAGER"
  | "FRONT_DESK"
  | "POS_CASHIER"
  | "KITCHEN"
  | "HOUSEKEEPING"
  | "ACCOUNTING";

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  allowedMenus?: string[];
  exp: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "เจ้าของกิจการ",
  MANAGER: "ผู้จัดการ",
  FRONT_DESK: "พนักงานต้อนรับ (Front Desk)",
  POS_CASHIER: "แคชเชียร์ห้องอาหาร (POS)",
  KITCHEN: "ครัว (Kitchen)",
  HOUSEKEEPING: "แม่บ้าน (Housekeeping)",
  ACCOUNTING: "บัญชี (Accounting)",
};

export interface MenuPermissionDef {
  href: string;
  label: string;
  defaultRoles?: UserRole[];
}

export const MENU_DEFINITIONS: MenuPermissionDef[] = [
  // 1. งานหน้าฟรอนต์ & บริการ
  {
    href: "/front-desk",
    label: "หน้าฟรอนต์ & ผังห้อง",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "ACCOUNTING"],
  },
  {
    href: "/billing",
    label: "รับชำระ",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "ACCOUNTING"],
  },
  {
    href: "/guests",
    label: "ข้อมูลลูกค้า",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK"],
  },
  {
    href: "/pos",
    label: "ขาย POS",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "POS_CASHIER", "KITCHEN"],
  },
  {
    href: "/void",
    label: "ยกเลิก",
    defaultRoles: ["OWNER", "MANAGER"],
  },
  // 2. แม่บ้าน & คลังสินค้า
  {
    href: "/housekeeping",
    label: "แม่บ้าน & ซ่อมบำรุง",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"],
  },
  {
    href: "/supplies",
    label: "เบิกของใช้",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"],
  },
  {
    href: "/receiving",
    label: "รับของเข้าคลัง",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "POS_CASHIER", "HOUSEKEEPING"],
  },
  {
    href: "/stock",
    label: "คลังสินค้า",
    defaultRoles: ["OWNER", "MANAGER", "FRONT_DESK", "POS_CASHIER", "HOUSEKEEPING"],
  },
  // 3. ผู้บริหาร & ระบบ
  {
    href: "/reports",
    label: "รายงาน",
    defaultRoles: ["OWNER", "MANAGER", "ACCOUNTING"],
  },
  {
    href: "/settings",
    label: "ตั้งค่าระบบ",
    defaultRoles: ["OWNER", "MANAGER"],
  },
];

export function getDefaultMenusForRole(role: UserRole): string[] {
  return MENU_DEFINITIONS.filter(
    (m) => !m.defaultRoles || m.defaultRoles.includes(role)
  ).map((m) => m.href);
}

export function resolveAllowedMenus(
  role: UserRole,
  allowedMenusRaw?: string | null
): string[] {
  if (allowedMenusRaw && allowedMenusRaw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(allowedMenusRaw);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      // fallback to role defaults
    }
  }
  return getDefaultMenusForRole(role);
}

export function hasVoidPermission(
  role: UserRole | string,
  allowedMenus?: string[]
): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  return Boolean(allowedMenus?.includes("/void") || allowedMenus?.includes("/pos/void"));
}
