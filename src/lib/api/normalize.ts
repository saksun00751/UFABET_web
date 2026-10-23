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
    const id = pickStr(p, ["pro_code", "code", "id"]);
    return {
      id,
      title: pickStr(p, ["name_th", "name", "title", "pro_name"], "โปรโมชั่น"),
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

export type DepositChannel = { id: string; name: string; type: string; description?: string; bankShort?: string };

export function normalizeChannels(data: unknown): DepositChannel[] {
  return asList<Dict>(data, ["channels"]).map((c) => ({
    id: pickStr(c, ["code", "id", "channel", "key"]),
    name: pickStr(c, ["name_th", "name", "title", "label"], "ช่องทางฝาก"),
    type: pickStr(c, ["type", "method", "kind"]).toLowerCase(),
    description: pickStr(c, ["description", "detail", "remark"]) || undefined,
    bankShort: pickStr(c, ["bank_shortcode", "shortcode", "bank.shortcode"]) || undefined,
  }));
}

export type DepositAccount = { bankName: string; bankShort: string; accNo: string; accName: string; qr?: string };

export function normalizeDepositAccount(data: unknown): DepositAccount | null {
  const src = (pick(data, ["account", "bank_account", "deposit_account"]) as unknown) ?? data;
  const accNo = pickStr(src, ["acc_no", "account_no", "account_number", "number"]);
  if (!accNo) return null;
  return {
    bankName: pickStr(src, ["bank_name", "bank.name_th", "name_th", "bank"]),
    bankShort: pickStr(src, ["bank_shortcode", "shortcode", "bank.shortcode"]),
    accNo,
    accName: pickStr(src, ["acc_name", "account_name", "name"]),
    qr: pickStr(src, ["qr_image", "qrcode", "qr"]) || undefined,
  };
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
    ref: pickStr(data, ["ref", "reference", "transaction_id", "txn_id", "id", "order_id", "payment.ref"]),
    amount: pickStr(data, ["amount", "payment.amount"]),
    status: pickStr(data, ["status", "state", "payment.status"], "PENDING").toUpperCase(),
    qrImage: pickStr(data, ["qr_image", "qr_image_url", "qrcode_url", "qr_url", "payment.qr_image"]) || undefined,
    qrText: pickStr(data, ["qr_text", "qrcode", "qr_code", "promptpay_payload", "payment.qr_text"]) || undefined,
    payUrl: pickStr(data, ["pay_url", "payment_url", "url", "redirect_url"]) || undefined,
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
    createdAt: pickStr(t, ["created_at", "date_create", "date", "time"]),
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

export type WheelPrize = { label: string; color?: string };
export type Wheel = { id: string; name: string; spinsLeft?: number; prizes: WheelPrize[]; description?: string };

export function normalizeWheels(data: unknown): Wheel[] {
  return asList<Dict>(data, ["wheels"]).map((w) => ({
    id: pickStr(w, ["code", "id", "wheel_code"]),
    name: pickStr(w, ["name", "title"], "วงล้อนำโชค"),
    description: pickStr(w, ["description", "condition", "detail"]) || undefined,
    spinsLeft: pick(w, ["spins_left", "remaining", "quota", "spin_left", "available_spins"]) !== undefined ? Number(pick(w, ["spins_left", "remaining", "quota", "spin_left", "available_spins"])) : undefined,
    prizes: asList<Dict>(pick(w, ["rewards", "prizes", "items", "segments"]) ?? []).map((p) => ({
      label: pickStr(p, ["label", "name", "title", "amount"], "?"),
      color: pickStr(p, ["color"]) || undefined,
    })),
  }));
}

export function normalizeSpin(data: unknown) {
  return {
    label: pickStr(data, ["reward.label", "reward.name", "prize.name", "label", "name", "reward_name"], "รางวัล"),
    amount: pickStr(data, ["reward.amount", "amount", "prize.amount", "value"]),
    index: pick<number>(data, ["index", "reward_index", "segment", "position"]),
  };
}

export type Coupon = { code: string; title: string; status: string; expiresAt?: string; value?: string; claimable: boolean };

export function normalizeCoupons(data: unknown): Coupon[] {
  return asList<Dict>(data, ["coupons"]).map((c) => {
    const status = pickStr(c, ["status", "state"]).toUpperCase();
    return {
      code: pickStr(c, ["code", "coupon_code", "id"]),
      title: pickStr(c, ["name", "title", "description"], "คูปอง"),
      status,
      expiresAt: pickStr(c, ["expired_at", "expires_at", "expire_date"]) || undefined,
      value: pickStr(c, ["amount", "value", "credit"]) || undefined,
      claimable: Boolean(pick(c, ["claimable", "can_claim"], !/USED|CLAIMED|EXPIRED/.test(status))),
    };
  });
}

export type Reward = { id: string; title: string; cost?: string; image?: string; description?: string; available: boolean };

export function normalizeRewards(data: unknown): { items: Reward[]; points?: string } {
  return {
    points: pickStr(data, ["points", "point", "my_points", "balance"]) || undefined,
    items: asList<Dict>(data, ["rewards"]).map((r) => ({
      id: pickStr(r, ["code", "id", "reward_code"]),
      title: pickStr(r, ["name", "title"], "ของรางวัล"),
      cost: pickStr(r, ["point", "points", "cost", "price"]) || undefined,
      image: pickStr(r, ["image_url", "image", "filepic"]) || undefined,
      description: pickStr(r, ["description", "detail"]) || undefined,
      available: Boolean(pick(r, ["available", "can_redeem", "enable"], true)),
    })),
  };
}

export function isRecord(v: unknown): v is Dict {
  return isDict(v);
}
