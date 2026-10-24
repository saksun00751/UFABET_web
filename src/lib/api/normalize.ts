/**
 * แปลง response ที่ schema ยังไม่ยืนยัน (⚠️) ให้เป็นรูปแบบที่ UI ใช้
 * แก้ key ที่นี่จุดเดียวเมื่อ backend ยืนยัน field จริง
 */
import { asList, isDict, pick, pickStr, type Dict } from "./shape";

export type Promo = {
  id: string;
  title: string;
  description: string;
  image?: string;
  selected: boolean;
  bonusText?: string;
  minDeposit?: string;
  turnover?: string;
  maxBonus?: string;
};

export function normalizePromotions(data: unknown): { items: Promo[]; selectedId?: string } {
  const selectedId = pickStr(data, ["selected.pro_code", "selected.code", "selected_code", "current.pro_code", "selected_pro_code"]) || undefined;
  const items = asList<Dict>(data, ["promotions", "promotion"]).map((p) => {
    const id = pickStr(p, ["code", "pro_code", "id"]);
    return {
      id,
      title: pickStr(p, ["name", "name_th", "title", "pro_name"], "โปรโมชั่น"),
      description: pickStr(p, ["description", "detail", "content", "remark"]),
      image: pickStr(p, ["image_url", "image", "banner", "filepic"]) || undefined,
      selected: Boolean(pick(p, ["selected", "is_selected", "active"], false)) || (!!selectedId && id === selectedId),
      bonusText: pickStr(p, ["bonus_display", "bonus_percent", "bonus_price", "bonus"]) || undefined,
      minDeposit: pickStr(p, ["min_deposit", "deposit_min", "min"]) || undefined,
      turnover: pickStr(p, ["turnover", "turn", "turnpro"]) || undefined,
      maxBonus: pickStr(p, ["max_bonus", "bonus_max", "max"]) || undefined,
    };
  });
  return { items, selectedId };
}

/** วิธีฝาก: bank (โอนธนาคาร) · tw (TrueMoney Wallet) · payment (ชำระออนไลน์/QR) — slip ยังไม่รองรับ (เอกสารไม่มี endpoint อัปโหลดสลิป) */
export type DepositMethod = { id: "bank" | "tw" | "payment"; name: string; desc: string; mode: "bank" | "qr" };

const METHODS: Record<string, Omit<DepositMethod, "id">> = {
  bank: { name: "โอนผ่านธนาคาร", desc: "โอนเข้าบัญชีรับฝาก", mode: "bank" },
  tw: { name: "TrueMoney Wallet", desc: "โอนเข้าวอลเล็ต", mode: "bank" },
  payment: { name: "ชำระออนไลน์ / QR", desc: "สร้างรายการฝากอัตโนมัติ", mode: "qr" },
};

/** deposit/channels → data.deposit = { bank, tw, payment, slip: จำนวนช่องทางที่ใช้ได้, sort: { [method]: ลำดับ | null } } */
export function normalizeMethods(data: unknown): DepositMethod[] {
  const dep = pick(data, ["deposit"]);
  if (!isDict(dep)) return [];
  const sort = isDict(dep.sort) ? dep.sort : {};
  return Object.keys(METHODS)
    .filter((id) => Number(dep[id]) > 0)
    .sort((a, b) => Number(sort[a] ?? 99) - Number(sort[b] ?? 99))
    .map((id) => ({ id: id as DepositMethod["id"], ...METHODS[id] }));
}

export type DepositAccount = { code: string; bankName: string; bankShort: string; accNo: string; accName: string; qr?: string; minDeposit?: string; remark?: string };

export function normalizeDepositAccounts(data: unknown): { accounts: DepositAccount[]; assignedCode?: string } {
  const accounts = asList<Dict>(data, ["bank", "accounts"])
    .map((a) => ({
      code: pickStr(a, ["code", "id"]),
      bankName: pickStr(a, ["bank_name", "name_th"]),
      bankShort: pickStr(a, ["shortcode", "bank_shortcode"]),
      accNo: pickStr(a, ["acc_no", "account_no"]),
      accName: pickStr(a, ["acc_name", "account_name"]),
      qr: Boolean(pick(a, ["qrcode"], false)) ? pickStr(a, ["qr_pic", "qr_image"]) || undefined : undefined,
      minDeposit: pickStr(a, ["deposit_min"]) || undefined,
      remark: pickStr(a, ["remark"]) || undefined,
    }))
    .filter((a) => a.accNo);
  return { accounts, assignedCode: pickStr(data, ["account.code"]) || undefined };
}

export type PaymentProvider = { id: string; name: string; minDeposit: number; remark?: string };

/** deposit/loadbank method=payment → bank เป็น map ที่ key ด้วย provider id */
export function normalizeProviders(data: unknown): PaymentProvider[] {
  const bank = pick(data, ["bank"]);
  if (!isDict(bank)) return [];
  return Object.entries(bank).flatMap(([key, p]) => {
    if (!isDict(p)) return [];
    return [
      {
        id: pickStr(p, ["id"], key),
        name: pickStr(p, ["name"], key),
        minDeposit: Number(pick(p, ["min_deposit"], 0)) || 0,
        remark: pickStr(p, ["remark"]) || undefined,
      },
    ];
  });
}

export type Payment = {
  ref: string;
  amount: string;
  status: string;
  qrImage?: string;
  qrText?: string;
  payUrl?: string;
  expiresAt?: string;
};

export function normalizePayment(data: unknown): Payment {
  return {
    ref: pickStr(data, ["transaction_id", "ref", "reference", "txn_id", "id", "order_id", "payment.ref"]),
    amount: pickStr(data, ["pay_amount", "amount", "payment.amount"]),
    status: pickStr(data, ["status", "state", "payment.status"], "PENDING").toUpperCase(),
    qrImage: pickStr(data, ["qr_image", "qr_image_url", "qrcode_url", "qr_url", "payment.qr_image"]) || undefined,
    qrText: pickStr(data, ["qr_text", "qrcode", "qr_code", "qr_payload", "promptpay_payload", "payment.qr_text"]) || undefined,
    payUrl: pickStr(data, ["payment_page_url", "checkout_url", "pay_url", "payment_url", "url", "redirect_url"]) || undefined,
    expiresAt: pickStr(data, ["expired_at", "expires_at", "expire_at"]) || undefined,
  };
}

export function paymentState(status: string): "pending" | "success" | "failed" | "expired" {
  const s = status.toUpperCase();
  if (["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED", "APPROVED", "DONE", "Y"].includes(s)) return "success";
  if (["EXPIRED", "TIMEOUT"].includes(s)) return "expired";
  if (["FAILED", "FAIL", "CANCELLED", "CANCELED", "REJECTED", "ERROR", "N"].includes(s)) return "failed";
  return "pending";
}

export type Txn = { id: string; amount: string; status: string; createdAt: string; channel?: string; note?: string };

export function normalizeTxns(data: unknown): Txn[] {
  return asList<Dict>(data, ["transactions", "deposits", "withdrawals"]).map((t) => ({
    id: pickStr(t, ["id", "code", "transaction_id", "bill_code"]),
    amount: pickStr(t, ["amount", "value", "credit"]),
    status: pickStr(t, ["status_display", "status", "state"]),
    createdAt: pickStr(t, ["recorded_at", "created_at", "date_create", "date", "time"]),
    channel: pickStr(t, ["channel", "bank_name", "bank", "method"]) || undefined,
    note: pickStr(t, ["remark", "note", "description"]) || undefined,
  }));
}

export function txnTone(status: string): "success" | "warning" | "destructive" | "outline" {
  const s = status.toUpperCase();
  if (/SUCCESS|APPROV|COMPLETE|DONE|สำเร็จ|^Y$/.test(s)) return "success";
  if (/FAIL|REJECT|CANCEL|ERROR|ไม่สำเร็จ|ยกเลิก|^N$/.test(s)) return "destructive";
  if (/PEND|WAIT|PROCESS|REVIEW|รอ/.test(s)) return "warning";
  return "outline";
}

export function txnLabel(status: string) {
  const tone = txnTone(status);
  if (/[ก-๙]/.test(status)) return status;
  return tone === "success" ? "สำเร็จ" : tone === "destructive" ? "ไม่สำเร็จ" : tone === "warning" ? "รอดำเนินการ" : status || "—";
}

export type WheelPrize = { label: string; color?: string; code?: string; image?: string };
export type Wheel = { id: string; name: string; spinsLeft?: number; prizes: WheelPrize[]; description?: string };

/** /wheel/list คืนวงล้อเดียว: wheel[] คือช่องรางวัลแต่ละช่อง (text, code, amount, fillStyle) */
export function normalizeWheels(data: unknown): Wheel[] {
  if (!Boolean(pick(data, ["enabled"], true))) return [];
  const prizes = asList<Dict>(data, ["wheel"]).map((p) => ({
    label: pickStr(p, ["text", "name", "amount"], "?"),
    color: pickStr(p, ["fillStyle", "spincolor"]) || undefined,
    code: pickStr(p, ["code"]) || undefined,
    image: pickStr(p, ["image", "img", "image_url", "icon", "picture"]) || undefined,
  }));
  return prizes.length ? [{ id: "main", name: "วงล้อนำโชค", prizes }] : [];
}

/** ผลหมุน: spin{code,types,amount} + format{title,msg,...} */
export function normalizeSpin(data: unknown) {
  return {
    code: pickStr(data, ["spin.code"]) || undefined,
    label: pickStr(data, ["format.title", "spin.types"], "รางวัล"),
    amount: pickStr(data, ["spin.amount"]),
    msg: pickStr(data, ["format.msg"]) || undefined,
    /** มุมที่ Winwheel ต้องหยุด (เซิร์ฟเวอร์กำหนด) */
    point: typeof pick(data, ["format.point"]) === "number" ? (pick(data, ["format.point"]) as number) : undefined,
  };
}

export type Coupon = { code: string; title: string; status: string; expiresAt?: string; value?: string; claimable: boolean };

export function normalizeCoupons(data: unknown): Coupon[] {
  return asList<Dict>(data, ["coupons"]).map((c) => {
    const status = pickStr(c, ["status", "state"]).toUpperCase();
    return {
      code: pickStr(c, ["code", "coupon_code", "id"]),
      title: pickStr(c, ["name", "title", "description", "type"], "คูปอง"),
      status,
      expiresAt: pickStr(c, ["date_expire", "expired_at", "expires_at", "expire_date"]) || undefined,
      value: pickStr(c, ["amount", "value", "credit"]) || undefined,
      claimable: Boolean(pick(c, ["claimable", "can_claim"], !/USED|CLAIMED|EXPIRED/.test(status))),
    };
  });
}

export type Reward = { id: string; title: string; cost?: string; image?: string; description?: string; available: boolean };

export function normalizeRewards(data: unknown): { items: Reward[]; points?: string } {
  return {
    points: pickStr(data, ["diamond", "points", "point", "my_points", "balance"]) || undefined,
    items: asList<Dict>(data, ["rewards"]).map((r) => ({
      id: pickStr(r, ["id", "reward_id", "code"]),
      title: pickStr(r, ["name", "title"], "ของรางวัล"),
      cost: pickStr(r, ["point_cost", "point", "points", "cost", "price"]) || undefined,
      image: pickStr(r, ["image_url", "image", "filepic"]) || undefined,
      description: pickStr(r, ["description", "detail"]) || undefined,
      available: Boolean(pick(r, ["available", "can_redeem", "enable"], true)),
    })),
  };
}

export function isRecord(v: unknown): v is Dict {
  return isDict(v);
}
