"use server";

import { ApiError, type Result } from "@/lib/api/client";
import { ops } from "@/lib/api/endpoints";
import { clearSession, readSession } from "@/lib/session-store";

/**
 * จุดเข้าเดียวที่ browser ใช้คุยกับ backend — เรียกได้เฉพาะ op ที่ลงทะเบียนใน endpoints.ts
 * ส่งผลกลับเป็น Result เพราะ Error ที่ throw จาก Server Action จะถูก Next ซ่อนข้อความใน production
 */
export async function invoke(op: string, args: unknown[] = []): Promise<Result<unknown>> {
  const fn = Object.hasOwn(ops, op) ? (ops as Record<string, (...a: unknown[]) => Promise<unknown>>)[op] : undefined;
  if (!fn || !Array.isArray(args)) {
    return { ok: false, error: { status: 404, code: "UNKNOWN_OPERATION", message: "ไม่พบคำสั่งที่เรียก", fields: {}, uncertain: false } };
  }
  try {
    return { ok: true, data: await fn(...args) };
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    // สมาชิกที่ล็อกอินอยู่แต่ Laravel session หมดอายุ → ล้างเซสชันของเรา (login รหัสผิด/guest ที่ได้ 401 ไม่ใช่เหตุให้ล้าง)
    if (e.status === 401 && op !== "auth.login" && (await readSession())?.status === "authenticated") await clearSession();
    return { ok: false, error: { status: e.status, code: e.code, message: e.message, fields: e.fields, uncertain: e.uncertain } };
  }
}
