import { EncryptJWT, jwtDecrypt } from "jose";

/** Edge-safe session helpers (ใช้ได้ทั้ง edge และ server) */
export const SESSION_COOKIE = "luxura_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน (Laravel session จริงอาจหมดก่อน → ล้างเมื่อ backend ตอบ 401)

/**
 * เซสชันฝั่ง Next.js = "กระเป๋า cookie" ของ Laravel (session, XSRF-TOKEN ฯลฯ) + CSRF token
 * เก็บเข้ารหัสใน httpOnly cookie — browser ไม่เคยเห็น cookie ของ Laravel
 * - pending       : มี Laravel session แล้วแต่ยังไม่ล็อกอิน (เช่น กำลังสมัคร preflight → submit)
 * - authenticated : เป็นสมาชิกที่ล็อกอินแล้ว
 */
export type SessionData = {
  jar: Record<string, string>;
  csrf?: string;
  status: "pending" | "authenticated";
  uid?: string;
  username?: string;
};

let keyPromise: Promise<Uint8Array> | null = null;
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  keyPromise ??= crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(secret || "dev-only-insecure-secret-change-me!!"))
    .then((b) => new Uint8Array(b));
  return keyPromise;
}

export async function sealSession(data: SessionData) {
  return new EncryptJWT({ ...data })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .encrypt(await key());
}

export async function unsealSession(value?: string | null): Promise<SessionData | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtDecrypt(value, await key());
    if (payload.status !== "pending" && payload.status !== "authenticated") return null;
    const jar = payload.jar && typeof payload.jar === "object" ? (payload.jar as Record<string, string>) : {};
    return {
      jar,
      csrf: typeof payload.csrf === "string" ? payload.csrf : undefined,
      status: payload.status,
      uid: payload.uid != null ? String(payload.uid) : undefined,
      username: payload.username != null ? String(payload.username) : undefined,
    };
  } catch {
    return null;
  }
}
