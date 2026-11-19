"use client";

import { Ban, Loader2, X } from "lucide-react";

export function VoidConfirmModal({
  open,
  title,
  subtitle,
  effects,
  presets,
  reason,
  onReasonChange,
  error,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  effects: string[];
  presets: string[];
  reason: string;
  onReasonChange: (val: string) => void;
  error: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-600" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
          <div className="font-semibold">เมื่อยืนยันยกเลิก ระบบจะดำเนินการอัตโนมัติ:</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {effects.map((eff) => (
              <li key={eff}>{eff}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            ระบุเหตุผลในการยกเลิก <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onReasonChange(preset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                  reason === preset
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="พิมพ์เหตุผลการยกเลิก..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {error && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Ban className="w-3.5 h-3.5" />
            )}
            ยืนยันยกเลิก (Void)
          </button>
        </div>
      </div>
    </div>
  );
}
