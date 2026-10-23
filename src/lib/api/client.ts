/**
 * ส่วนที่ใช้ร่วมกันระหว่าง server และ browser (ไม่มี fetch ที่นี่)
 * - การเรียก Laravel จริงอยู่ที่ server.ts (server-only) และเรียกผ่าน Server Action `invoke` เท่านั้น
 * - ฝั่ง browser ใช้ member.ts ซึ่งเรียก `invoke` แล้วแปลงผลกลับเป็น ApiError
 */
export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string; errors?: Record<string, string[]>; fields?: Record<string, string[]> };
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  code: string;
  fields: Record<string, string[]>;
  /** true = ไม่ทราบผลแน่ชัด (เน็ตหลุด/timeout) — ห้ามสร้าง Idempotency Key ใหม่ */
  uncertain: boolean;
  constructor(status: number, code: string, message: string, fields: Record<string, string[]> = {}, uncertain = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.uncertain = uncertain;
  }
}

/** รูปแบบที่ Server Action ส่งข้ามขอบเขต server→browser (Error object ข้ามไปไม่ได้) */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { status: number; code: string; message: string; fields: Record<string, string[]>; uncertain: boolean } };

/** สุ่ม Idempotency Key 12–64 ตัวอักษร */
export function newIdempotencyKey(prefix = "web") {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${rand}`.slice(0, 64);
}
