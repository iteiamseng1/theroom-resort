"use client";

import { Printer } from "lucide-react";

export function ManualPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5EE]/10 hover:bg-[#FAF5EE]/20 text-[#F6DC93] text-xs font-semibold transition"
      title="พิมพ์เอกสาร"
    >
      <Printer className="w-4 h-4" />
      <span className="hidden sm:inline">พิมพ์เอกสาร</span>
    </button>
  );
}
