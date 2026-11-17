"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BedDouble,
  Boxes,
  ClipboardCheck,
  FileSpreadsheet,
  LogOut,
  PackageCheck,
  PackagePlus,
  Receipt,
  Settings,
  Smartphone,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import type { SessionUser, UserRole } from "@/lib/roles";
import { ROLE_LABELS } from "@/lib/roles";
import { ResortLogo } from "@/components/ResortLogo";

type NavGroupKey = "front" | "ops" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: NavGroupKey;
  roles?: UserRole[];
  mobileOrder?: number;
}

const NAV_GROUPS: { key: NavGroupKey; title: string }[] = [
  { key: "front", title: "งานหน้าฟรอนต์ & บริการ" },
  { key: "ops", title: "แม่บ้าน & คลังสินค้า" },
  { key: "admin", title: "ผู้บริหาร & ระบบ" },
];

const NAV_ITEMS: NavItem[] = [
  // 1. งานหน้าฟรอนต์ & บริการ
  {
    href: "/front-desk",
    label: "หน้าฟรอนต์ & ผังห้อง",
    icon: BedDouble,
    group: "front",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "ACCOUNTING"],
    mobileOrder: 2,
  },
  {
    href: "/billing",
    label: "รับชำระ",
    icon: Receipt,
    group: "front",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "ACCOUNTING"],
    mobileOrder: 3,
  },
  {
    href: "/guests",
    label: "ข้อมูลลูกค้า",
    icon: Users,
    group: "front",
    roles: ["OWNER", "MANAGER", "FRONT_DESK"],
  },
  {
    href: "/pos",
    label: "ขาย POS",
    icon: UtensilsCrossed,
    group: "front",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "POS_CASHIER", "KITCHEN"],
    mobileOrder: 6,
  },
  // 2. แม่บ้าน & คลังสินค้า
  {
    href: "/housekeeping",
    label: "แม่บ้าน & ซ่อมบำรุง",
    icon: ClipboardCheck,
    group: "ops",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"],
    mobileOrder: 5,
  },
  {
    href: "/supplies",
    label: "เบิกของใช้",
    icon: PackageCheck,
    group: "ops",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"],
    mobileOrder: 7,
  },
  {
    href: "/receiving",
    label: "รับของเข้าคลัง",
    icon: PackagePlus,
    group: "ops",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "POS_CASHIER", "HOUSEKEEPING"],
  },
  {
    href: "/stock",
    label: "คลังสินค้า",
    icon: Boxes,
    group: "ops",
    roles: ["OWNER", "MANAGER", "FRONT_DESK", "POS_CASHIER", "HOUSEKEEPING"],
    mobileOrder: 8,
  },
  // 3. ผู้บริหาร & ระบบ
  {
    href: "/reports",
    label: "รายงาน",
    icon: FileSpreadsheet,
    group: "admin",
    roles: ["OWNER", "MANAGER", "ACCOUNTING"],
    mobileOrder: 4,
  },
  {
    href: "/settings",
    label: "ตั้งค่าระบบ",
    icon: Settings,
    group: "admin",
    roles: ["OWNER", "MANAGER"],
  },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AppShell({
  user,
  hotelName,
  children,
}: {
  user: SessionUser;
  hotelName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (user.allowedMenus) {
      return user.allowedMenus.includes(item.href);
    }
    return !item.roles || item.roles.includes(user.role);
  });
  const mobileNav = visibleNav
    .filter((i) => i.mobileOrder != null)
    .sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99))
    .slice(0, 5);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF6EE]">
      {/* Desktop Sidebar (collapsed icon rail, expands on hover) */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`no-print hidden md:flex md:flex-col md:fixed md:inset-y-0 left-0 z-40 bg-[#2D160B] text-[#FAF5EE] border-r border-[#C89B35]/25 transition-all duration-200 ease-out overflow-hidden ${
          sidebarExpanded ? "md:w-64 shadow-2xl" : "md:w-16"
        }`}
      >
        <div
          className={`border-b border-[#C89B35]/20 flex flex-col items-center transition-all duration-200 ${
            sidebarExpanded ? "px-4 py-4" : "px-2 py-3"
          }`}
        >
          <ResortLogo
            className={`h-auto drop-shadow-sm transition-all duration-200 ${
              sidebarExpanded ? "w-40" : "w-11"
            }`}
          />
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_GROUPS.map((group, groupIdx) => {
            const items = visibleNav.filter((item) => item.group === group.key);
            if (items.length === 0) return null;
            return (
              <div
                key={group.key}
                className={groupIdx > 0 ? "pt-2 mt-2 border-t border-[#C89B35]/15 space-y-1" : "space-y-1"}
              >
                {sidebarExpanded && (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-[#C89B35]/75 whitespace-nowrap">
                    {group.title}
                  </div>
                )}
                {items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      title={!sidebarExpanded ? item.label : undefined}
                      className={`flex items-center rounded-lg text-sm font-medium transition ${
                        sidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-0 py-2.5"
                      } ${
                        active
                          ? "bg-gradient-to-r from-[#D4AF49] to-[#B68621] text-[#241007] font-bold shadow-sm"
                          : "text-[#EADFCF] hover:bg-[#432313] hover:text-[#F6DC93]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[#C89B35]/20 space-y-2">
          {installPrompt && (
            <button
              onClick={handleInstall}
              title={!sidebarExpanded ? "ติดตั้งแอป (PWA)" : undefined}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#C89B35]/20 hover:bg-[#C89B35]/30 text-[#F6DC93] text-xs font-medium transition ${
                sidebarExpanded ? "px-3" : "px-0"
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span className="truncate">ติดตั้งแอป (PWA)</span>}
            </button>
          )}

          {sidebarExpanded ? (
            <div className="px-3 py-2 rounded-lg bg-[#3D1F10] border border-[#C89B35]/20">
              <div className="text-xs font-semibold text-[#FAF5EE] truncate">{user.name}</div>
              <div className="text-[11px] text-[#E4C165] truncate">
                {ROLE_LABELS[user.role] ?? user.role}
              </div>
            </div>
          ) : (
            <div
              title={`${user.name} (${ROLE_LABELS[user.role] ?? user.role})`}
              className="w-full py-2 rounded-lg bg-[#3D1F10] border border-[#C89B35]/20 flex items-center justify-center text-xs font-bold text-[#F6DC93]"
            >
              {user.name.slice(0, 1)}
            </div>
          )}

          <button
            onClick={handleLogout}
            title={!sidebarExpanded ? "ออกจากระบบ" : undefined}
            className={`w-full flex items-center rounded-lg text-xs text-[#EADFCF] hover:bg-rose-500/20 hover:text-rose-200 transition ${
              sidebarExpanded ? "gap-2 px-3 py-2" : "justify-center px-0 py-2"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarExpanded && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="no-print md:hidden sticky top-0 z-50 w-full bg-[#2D160B] text-[#FAF5EE] border-b border-[#C89B35]/25 pt-[env(safe-area-inset-top,0px)]">
        <div className="px-4 py-2.5 flex items-center justify-between min-h-[52px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo-theroom.svg"
              alt="The Room Resort"
              className="w-11 h-auto rounded-md shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate text-[#F6DC93]">
                {hotelName}
              </div>
              <div className="text-[10px] text-[#EADFCF]/80 truncate">
                {user.name} • {ROLE_LABELS[user.role] ?? user.role}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="p-2 rounded-lg bg-[#C89B35]/20 text-[#F6DC93]"
                title="ติดตั้งแอป"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}
            {visibleNav.some((n) => n.href === "/settings") && (
              <Link href="/settings" prefetch={false} className="p-2 rounded-lg hover:bg-[#432313] text-[#EADFCF]">
                <Settings className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-[#432313] text-[#EADFCF]"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-16 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
        <div className="max-w-[1600px] mx-auto p-2.5 sm:p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF6EE] border-t border-[#E6D9C2] flex justify-around pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] px-1">
        {mobileNav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium min-w-[56px] ${
                active ? "text-[#9E731A] font-bold" : "text-[#6E5644]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[64px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
