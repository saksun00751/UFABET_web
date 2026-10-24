/** ตัวตรวจข้อมูลฟอร์ม — คืนข้อความ error ภาษาไทย หรือ undefined เมื่อผ่าน */
export type Check = string | undefined;

export const required = (v: string, label: string): Check => (v.trim() ? undefined : `กรุณากรอก${label}`);

/** เบอร์มือถือไทย 10 หลัก ขึ้นต้นด้วย 0 (login ผ่อนปรนเป็น 9–10 หลักตามบัญชีเดิม) */
export function phone(v: string, strict = true): Check {
  if (!v) return "กรุณากรอกเบอร์โทรศัพท์";
  if (strict) return /^0\d{9}$/.test(v) ? undefined : "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0";
  return v.length >= 9 ? undefined : "เบอร์โทรศัพท์ไม่ถูกต้อง";
}

export function password(v: string, min = 8): Check {
  if (!v) return "กรุณากรอกรหัสผ่าน";
  return v.length >= min ? undefined : `รหัสผ่านต้องมีอย่างน้อย ${min} ตัวอักษร`;
}

export function passwordMatch(a: string, b: string): Check {
  if (!b) return "กรุณายืนยันรหัสผ่าน";
  return a === b ? undefined : "รหัสผ่านไม่ตรงกัน";
}

export function accountNo(v: string): Check {
  if (!v) return "กรุณากรอกเลขบัญชี";
  return v.length >= 10 && v.length <= 15 ? undefined : "เลขบัญชีต้องมี 10–15 หลัก";
}

export function personName(v: string, label: string): Check {
  const s = v.trim();
  if (!s) return `กรุณากรอก${label}`;
  if (s.length < 2) return `${label}สั้นเกินไป`;
  if (/[\d<>]/.test(s)) return `${label}ไม่ถูกต้อง`;
  return undefined;
}

export function couponCode(v: string): Check {
  if (!v) return "กรุณากรอกรหัสคูปอง";
  return /^[A-Z0-9_-]{3,32}$/.test(v) ? undefined : "รหัสคูปองต้องเป็นตัวอักษร/ตัวเลข 3–32 ตัว";
}

export interface AmountRules {
  min?: number;
  max?: number;
  available?: number;
}

export function amount(raw: string, n: number, { min = 0, max = 0, available }: AmountRules = {}): Check {
  if (!raw) return "กรุณากรอกจำนวนเงิน";
  if (!(n > 0)) return "จำนวนเงินต้องมากกว่า 0";
  if (/\.\d{3,}$/.test(raw)) return "ทศนิยมได้ไม่เกิน 2 ตำแหน่ง";
  if (min > 0 && n < min) return `ขั้นต่ำ ฿${min.toLocaleString("th-TH")}`;
  if (max > 0 && n > max) return `สูงสุด ฿${max.toLocaleString("th-TH")}`;
  if (available !== undefined && n > available) return "ยอดเงินไม่เพียงพอ";
  return undefined;
}

export const firstError = (errs: Record<string, Check>) => Object.values(errs).find(Boolean);
