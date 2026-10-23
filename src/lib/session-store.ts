import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, sealSession, unsealSession, type SessionData } from "./session-core";

export const readSession = async () => unsealSession((await cookies()).get(SESSION_COOKIE)?.value);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
} as const;

export async function writeSession(data: SessionData) {
  (await cookies()).set(SESSION_COOKIE, await sealSession(data), cookieOptions);
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** เขียนเซสชันแบบ best-effort — ใน Server Component จะ set cookie ไม่ได้ (Next จะ throw) ให้ข้ามไป */
export async function tryWriteSession(data: SessionData) {
  const sealed = await sealSession(data); // ตั้งค่าผิด (เช่น SESSION_SECRET) ต้อง throw ให้เห็น ไม่กลืน
  try {
    (await cookies()).set(SESSION_COOKIE, sealed, cookieOptions);
  } catch {
    /* read-only context */
  }
}
