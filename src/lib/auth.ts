import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { SessionUser, UserRole } from "./roles";
export { ROLE_LABELS } from "./roles";
export type { SessionUser, UserRole } from "./roles";

const COOKIE_NAME = "theroom_session";

function getSecret(): string {
  return process.env.AUTH_SECRET || "theroom-pms-dev-secret-change-in-production";
}

export function createSessionToken(user: Omit<SessionUser, "exp">): string {
  const payload: SessionUser = {
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionUser;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
