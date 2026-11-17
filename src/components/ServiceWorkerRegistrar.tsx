"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

export function ServiceWorkerRegistrar() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Check for updates on startup, window focus, and visibility
        reg.update().catch(() => {});

        const onCheck = () => {
          reg.update().catch(() => {});
        };
        window.addEventListener("focus", onCheck);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") onCheck();
        });

        // If there is already a waiting worker
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new worker installed
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
      });
  }, []);

  function handleUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }

  if (!updateAvailable) return null;

  return (
    <aside
      aria-label="การแจ้งเตือนอัปเดต"
      className="no-print fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 z-[9999] max-w-md bg-[#2D160B] text-[#FAF5EE] border border-[#C89B35] rounded-xl shadow-2xl p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#C89B35]/20 text-[#F6DC93] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#F6DC93]">มีเวอร์ชันใหม่พร้อมใช้งาน</div>
          <div className="text-[10px] text-[#EADFCF]/80 truncate">
            ระบบอัปเดตแล้ว แตะเพื่อใช้งานเวอร์ชันล่าสุด
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleUpdate}
        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF49] to-[#B68621] hover:from-[#DFBC59] hover:to-[#C69328] text-[#241007] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition active:scale-95 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        อัปเดตทันที
      </button>
    </aside>
  );
}
