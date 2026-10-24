import { ApiError } from "./client";

const TH: Record<string, string> = {
  INVALID_CREDENTIALS: "เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง",
  UNAUTHENTICATED: "กรุณาเข้าสู่ระบบใหม่",
  MEMBER_UNAVAILABLE: "บัญชีนี้ถูกระงับหรือยังไม่ได้รับการยืนยัน กรุณาติดต่อเจ้าหน้าที่",
  REGISTRATION_CONFLICT: "เบอร์โทร ชื่อ หรือบัญชีธนาคารนี้ถูกใช้สมัครแล้ว",
  BANK_ACCOUNT_RESERVED: "บัญชีธนาคารนี้ถูกใช้งานแล้ว",
  ACCOUNT_ALREADY_AUTHENTICATED: "คุณเข้าสู่ระบบอยู่แล้ว กรุณาออกจากระบบก่อนสมัครใหม่",
  CSRF_TOKEN_MISMATCH: "Session หมดอายุ กรุณาลองใหม่",
  RATE_LIMITED: "ทำรายการถี่เกินไป กรุณารอสักครู่",
  UNSUPPORTED_BANK: "ธนาคารนี้ยังไม่รองรับ",
  BANK_NAME_LOOKUP_FAILED: "ตรวจสอบชื่อบัญชีไม่สำเร็จ กรุณากรอกชื่อเอง",
  BANK_NAME_SERVICE_NOT_READY: "ระบบตรวจชื่อบัญชีไม่พร้อม กรุณากรอกชื่อเอง",
  REGISTRATION_NOT_READY: "ระบบปิดรับสมัครชั่วคราว กรุณาลองใหม่ภายหลัง",
  REFERRAL_INVALID: "รหัสผู้แนะนำไม่ถูกต้อง",
  REFERRAL_CONFLICT: "รหัสผู้แนะนำไม่ตรงกัน",
  IDEMPOTENCY_KEY_REQUIRED: "คำขอไม่สมบูรณ์ กรุณาลองใหม่",
  BONUS_BALANCE_EMPTY: "ไม่มียอดโบนัสให้โยก",
  BONUS_RESET_REQUIRED: "ต้องเคลียร์เงื่อนไขโปรโมชั่นก่อนโยกโบนัส",
  BONUS_BELOW_MINIMUM: "ยอดโบนัสยังไม่ถึงขั้นต่ำ",
  BONUS_TRANSFER_REQUIRES_REVIEW: "รายการกำลังตรวจสอบ ห้ามทำซ้ำ กรุณาติดต่อเจ้าหน้าที่",
  BONUS_MODE_UNSUPPORTED: "ระบบยังไม่เปิดโยกโบนัส",
  UFA_GAME_NOT_READY: "บัญชีเกมยังไม่พร้อม กรุณาติดต่อเจ้าหน้าที่",
  PROVIDER_BALANCE_NOT_VERIFIED: "ยังตรวจสอบยอดเครดิตในเกมไม่ได้ กรุณาออกจากเกมแล้วรอสักครู่ก่อนลองถอนใหม่ หากยังไม่ได้ติดต่อเจ้าหน้าที่",
  BELOW_MINIMUM: "ยอดถอนต่ำกว่าขั้นต่ำที่กำหนด",
  INSUFFICIENT_BALANCE: "ยอดเงินไม่เพียงพอ",
  NETWORK_ERROR: "เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต",
};

export function errorMessage(err: unknown, fallback = "เกิดข้อผิดพลาด กรุณาลองใหม่") {
  if (err instanceof ApiError) {
    if (TH[err.code.toUpperCase()]) return TH[err.code.toUpperCase()];
    const first = Object.values(err.fields ?? {})[0]?.[0];
    if (first) return first;
    if (err.status === 422) return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
    if (err.status >= 500) return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่";
    return err.message || fallback;
  }
  return fallback;
}

/** แปลเหตุผลที่ backend ส่งมาเป็นรหัส (เช่น reasons[] ใน withdraw/eligibility) เป็นข้อความไทย */
export function reasonText(code: string): string {
  const key = code.trim().toUpperCase();
  if (TH[key]) return TH[key];
  // รหัสที่ยังไม่รู้จัก (SNAKE_CASE ล้วน) ไม่แสดงให้ผู้ใช้เห็นตรงๆ
  if (/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(key)) return "ยังไม่สามารถถอนได้ในขณะนี้ กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่";
  return code;
}

export function fieldError(err: unknown, field: string): string | undefined {
  if (err instanceof ApiError) return err.fields?.[field]?.[0];
  return undefined;
}
