/**
 * Member API v1 — ด้านที่ client component เรียกใช้ (signature เดิมทุกอย่าง)
 * ไม่ได้ยิง Laravel ตรง: ทุกฟังก์ชันเรียก Server Action `invoke` → endpoints.ts (server-only)
 * cookie/CSRF ของ Laravel อยู่ในเซสชันเข้ารหัสฝั่ง server เท่านั้น
 * เอกสาร: UFABET_API_DOC.html (Updated 22 Oct 2026) — ✅/⚠️ ดูที่ endpoints.ts
 */
import { invoke } from "@/app/actions/api";
import type { ops } from "./endpoints";
import { ApiError, newIdempotencyKey } from "./client";

export * from "./types";

type Ops = typeof ops;

async function run<K extends keyof Ops>(op: K, ...args: Parameters<Ops[K]>): Promise<Awaited<ReturnType<Ops[K]>>> {
  let r;
  try {
    r = await invoke(op, args);
  } catch {
    // Server Action ล้ม/เน็ตหลุดก่อนได้คำตอบ = ไม่ทราบผล
    throw new ApiError(0, "NETWORK_ERROR", "เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต", {}, true);
  }
  if (!r.ok) throw new ApiError(r.error.status, r.error.code, r.error.message, r.error.fields, r.error.uncertain);
  return r.data as Awaited<ReturnType<Ops[K]>>;
}

export const session = {
  csrf: () => run("session.csrf"),
};

export const register = {
  banks: () => run("register.banks"),
  bankName: (bank: number, acc_no: string) => run("register.bankName", bank, acc_no),
  preflight: (p: Parameters<Ops["register.preflight"]>[0]) => run("register.preflight", p),
  submit: (p: Parameters<Ops["register.submit"]>[0]) => run("register.submit", p),
};

export const auth = {
  login: (user_name: string, password: string) => run("auth.login", user_name, password),
  me: () => run("auth.me"),
  logout: () => run("auth.logout"),
};

export const referralCheck = (referral_code: string) => run("referral.check", referral_code);

export const member = {
  overview: () => run("member.overview"),
  profile: () => run("member.profile"),
  balance: () => run("member.balance"),
  /** ดึงยอดล่าสุดจากผู้ให้บริการเกม (หนักกว่า /balance) */
  loadBalance: () => run("member.loadBalance"),
};

export const game = {
  login: (body: Record<string, unknown> = {}) => run("game.login", body),
};

export const realtime = {
  config: () => run("realtime.config"),
  auth: (socket_id: string, channel_name: string) => run("realtime.auth", socket_id, channel_name),
};

export const promotion = {
  list: () => run("promotion.list"),
  select: (code: string | number) => run("promotion.select", code),
  deselect: () => run("promotion.deselect"),
};

export const deposit = {
  channels: () => run("deposit.channels"),
  select: (channel: string | number) => run("deposit.select", channel),
  selectRandom: () => run("deposit.selectRandom"),
  createPayment: (amount: number, channel?: string | number) => run("deposit.createPayment", amount, newIdempotencyKey("dep"), channel),
  paymentStatus: (ref?: string) => run("deposit.paymentStatus", ref),
};

export const withdraw = {
  eligibility: () => run("withdraw.eligibility"),
  quote: (amount: number) => run("withdraw.quote", amount),
  /** X-Idempotency-Key ต้องคงเดิมถ้าผลไม่แน่ชัด (timeout) — ดู hooks/use-idempotent.ts */
  submit: (amount: number, idempotencyKey: string) => run("withdraw.submit", amount, idempotencyKey),
};

export const transactions = {
  deposits: (page = 1, per_page = 20) => run("transactions.deposits", page, per_page),
  withdrawals: (page = 1, per_page = 20) => run("transactions.withdrawals", page, per_page),
};

export const wheel = {
  list: () => run("wheel.list"),
  history: (page = 1) => run("wheel.history", page),
  spin: (wheel_code?: string | number) => run("wheel.spin", newIdempotencyKey("spin"), wheel_code),
};

export const coupon = {
  my: () => run("coupon.my"),
  redeem: (code: string) => run("coupon.redeem", code, newIdempotencyKey("cpn")),
  claim: (code: string) => run("coupon.claim", code, newIdempotencyKey("cpc")),
};

export const reward = {
  list: () => run("reward.list"),
  history: (page = 1) => run("reward.history", page),
  redeem: (code: string | number) => run("reward.redeem", code, newIdempotencyKey("rwd")),
};

export const bonus = {
  wallet: () => run("bonus.wallet"),
  /** โยก BONUS ทั้งหมด — key เดิมถ้าผลไม่แน่ชัด */
  transfer: (idempotencyKey: string) => run("bonus.transfer", idempotencyKey),
};

export const referral = {
  overview: () => run("referral.overview"),
  members: (page = 1, per_page = 20) => run("referral.members", page, per_page),
  earnings: (page = 1, per_page = 20) => run("referral.earnings", page, per_page),
};
