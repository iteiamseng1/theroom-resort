"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, User } from "lucide-react";
import { ResortLogo } from "@/components/ResortLogo";

const DEMO_ACCOUNTS = [
  { username: "admin", pass: "admin123", label: "เจ้าของ / ผู้จัดการ", badge: "OWNER" },
  { username: "frontdesk", pass: "1234", label: "หน้าฟรอนต์", badge: "FRONT_DESK" },
  { username: "housekeeping", pass: "1234", label: "แม่บ้าน", badge: "HOUSEKEEPING" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotNote, setForgotNote] = useState("");
  const [forgotStatus, setForgotStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleForgotSubmit() {
    setForgotStatus(null);
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: forgotUsername || username,
          note: forgotNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotStatus({ ok: false, msg: data.error || "ส่งคำขอไม่สำเร็จ" });
        return;
      }
      setForgotStatus({
        ok: true,
        msg: data.message || "ส่งคำขอรีเซ็ตรหัสผ่านให้ผู้จัดการแล้ว กรุณารอผู้จัดการอนุมัติ",
      });
      setForgotNote("");
    } catch {
      setForgotStatus({ ok: false, msg: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    } finally {
      setForgotLoading(false);
    }
  }

  async function doLogin(u: string, p: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      const role = data.user?.role as string | undefined;
      const allowedMenus = (data.user?.allowedMenus as string[] | undefined) || [];
      if (role === "OWNER" || role === "MANAGER") {
        router.push("/reports");
      } else if (role === "HOUSEKEEPING") {
        router.push("/housekeeping");
      } else if (role === "FRONT_DESK") {
        router.push("/front-desk");
      } else if (allowedMenus.length > 0) {
        router.push(allowedMenus[0]);
      } else {
        router.push("/front-desk");
      }
      router.refresh();
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1F0F07] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FAF6EE] border border-[#C89B35]/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#2D160B] text-[#FAF5EE] px-6 py-6 flex flex-col items-center text-center gap-3 border-b border-[#C89B35]/30">
          <ResortLogo className="w-44 h-auto drop-shadow-md" />
          <p className="text-xs text-[#E4C165]">
            ระบบบริหารโรงแรม ที่พักรายเดือน &amp; ห้องอาหาร POS
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            doLogin(username, password);
          }}
          className="p-6 space-y-4"
        >
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot((v) => !v);
                  setForgotUsername(username);
                  setForgotStatus(null);
                }}
                className="text-xs font-semibold text-amber-800 hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          {showForgot && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2.5 text-xs">
              <div className="font-bold text-amber-950">
                ขอลืมรหัสผ่าน (ส่งให้ผู้จัดการอนุมัติ)
              </div>
              <input
                type="text"
                placeholder="ชื่อผู้ใช้ (Username) เช่น frontdesk"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs"
              />
              <input
                type="text"
                placeholder="หมายเหตุถึงผู้จัดการ (ถ้ามี)"
                value={forgotNote}
                onChange={(e) => setForgotNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs"
              />
              {forgotStatus && (
                <div
                  className={`px-2.5 py-2 rounded-lg font-medium ${
                    forgotStatus.ok
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {forgotStatus.msg}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotSubmit}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50"
                >
                  {forgotLoading ? "กำลังส่ง..." : "ส่งคำขอให้ผู้จัดการอนุมัติ"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-slate-700 font-medium"
                >
                  ปิด
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF49] to-[#B68621] hover:from-[#DFBC59] hover:to-[#C69328] text-[#241007] font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            เข้าสู่ระบบ
          </button>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">
              เข้าสู่ระบบด่วน (บัญชีทดสอบตามตำแหน่ง):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword(acc.pass);
                    doLogin(acc.username, acc.pass);
                  }}
                  className="text-left px-3 py-2 rounded-lg border border-[#E6D9C2] bg-white hover:border-[#C89B35] hover:bg-[#FAF0DC] transition"
                >
                  <div className="text-xs font-semibold text-slate-800">{acc.label}</div>
                  <div className="text-[10px] text-slate-400">{acc.username}</div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
