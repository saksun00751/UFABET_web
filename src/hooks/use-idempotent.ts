"use client";
import * as React from "react";
import { ApiError, newIdempotencyKey } from "@/lib/api/client";

/**
 * จัดการ X-Idempotency-Key สำหรับเส้นที่เกี่ยวกับเงิน (withdraw/submit, bonus/transfer)
 * - สร้าง key ใหม่เฉพาะเมื่อรายการก่อนหน้า "จบผลแน่ชัด" (สำเร็จ หรือ 4xx)
 * - ถ้า timeout/เน็ตหลุด (uncertain) จะคง key เดิมไว้ — ลองซ้ำด้วย key เดิมเท่านั้น
 */
export function useIdempotentKey(prefix: string) {
  const keyRef = React.useRef<string | null>(null);
  const [uncertain, setUncertain] = React.useState(false);

  const current = React.useCallback(() => {
    if (!keyRef.current) keyRef.current = newIdempotencyKey(prefix);
    return keyRef.current;
  }, [prefix]);

  const settle = React.useCallback((err?: unknown) => {
    if (err instanceof ApiError && (err.uncertain || err.code === "BONUS_TRANSFER_REQUIRES_REVIEW")) {
      setUncertain(true);
      return; // คง key เดิม
    }
    setUncertain(false);
    keyRef.current = null;
  }, []);

  return { current, settle, uncertain };
}
