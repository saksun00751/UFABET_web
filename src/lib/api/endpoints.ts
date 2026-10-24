import "server-only";
import { readSession, writeSession, clearSession } from "../session-store";
import { apiFetch, call, freshBackend, publicGet, type Backend } from "./server";
import { ApiError } from "./client";
import { site } from "../site";
import type {
  Bank, BankNameResult, BonusTransferResult, BonusWallet, LoginResult, MeResult, Paged, PreflightResult, ReferralEarning,
  ReferralMember, ReferralOverview, RegisterPayload, RegisterResult, ContactChannel,
} from "./types";

/**
 * ===== Endpoint map (Member API v1) — 44 เส้น =====
 * เป็นรายการเดียวที่ browser เรียกได้ (ผ่าน Server Action `invoke` ใน app/actions/api.ts)
 * แก้ path/payload ที่นี่ที่เดียว · ฟังก์ชันที่แก้ session (login, register, logout) ก็อยู่ที่นี่
 *
 * ✅ = schema ยืนยันจากเอกสาร · ⚠️ = เดาจากระบบเดิม ต้องยืนยันกับ backend
 */
type Dict = Record<string, unknown>;

/** ปิดรับสมัครผ่าน env → ปฏิเสธฝั่ง server ด้วย (ไม่ใช่แค่ซ่อน UI) */
const requireRegistration = () => {
  if (!site.registration) throw new ApiError(403, "REGISTRATION_CLOSED", "ขณะนี้ปิดรับสมัครสมาชิก");
};

const get = <T = Dict>(path: string, query?: Record<string, string | number | undefined>) => apiFetch<T>(path, { query });
const post = <T = Dict>(path: string, body: unknown = {}, idempotencyKey?: string) =>
  apiFetch<T>(path, { method: "POST", body, headers: idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined });

/** บันทึกเซสชันของเราหลังเรียก endpoint ที่ทำให้ Laravel session เปลี่ยนสถานะ */
const commit = (state: Backend, status: "pending" | "authenticated", member?: { code: number; user_name: string }) =>
  writeSession({ jar: state.jar, csrf: state.csrf, status, uid: member ? String(member.code) : undefined, username: member?.user_name });

export const ops = {
  /* ───── Session / Auth ───── */
  "session.csrf": () => get<{ csrf_token: string }>("/session/csrf"),

  /** ✅ login ด้วย Laravel session ใหม่เสมอ (กัน session fixation) */
  async "auth.login"(user_name: string, password: string) {
    const state = await freshBackend();
    const d = await call<LoginResult>("/auth/login", { method: "POST", body: { user_name: String(user_name), password: String(password) } }, state);
    await commit(state, d.authenticated ? "authenticated" : "pending", d.member);
    return d;
  },
  /** ✅ ยังไม่เคยล็อกอิน (ไม่มีเซสชัน/เป็น pending) = ไม่ต้องถาม backend และไม่แตะเซสชัน pending ของการสมัคร */
  async "auth.me"(): Promise<MeResult> {
    if ((await readSession())?.status !== "authenticated") return { authenticated: false };
    return get<MeResult>("/auth/me");
  },
  /** ✅ */
  async "auth.logout"() {
    try {
      return await post<{ authenticated: false; csrf_token: string }>("/auth/logout");
    } finally {
      await clearSession();
    }
  },

  /* ───── Register ───── */
  /** ✅ รายชื่อธนาคารเป็นข้อมูลสาธารณะ แคช 1 ชม. ไม่ต้องสร้างเซสชัน */
  "register.banks": () => publicGet<{ banks: Bank[] }>("/register/banks", 3600),
  "register.bankName": (bank: number, acc_no: string) => post<BankNameResult>("/register/bank-name", { bank: Number(bank), acc_no: String(acc_no) }),
  "register.preflight": (p: RegisterPayload) => {
    requireRegistration();
    return post<PreflightResult>("/register/preflight", p);
  },
  /** ✅ ใช้ session เดียวกับ preflight แล้วอัปเดตสถานะตามผล */
  async "register.submit"(p: RegisterPayload) {
    requireRegistration();
    const s = await readSession();
    const state: Backend = { jar: { ...(s?.jar ?? {}) }, csrf: s?.csrf };
    const d = await call<RegisterResult>("/register", { method: "POST", body: p }, state);
    await commit(state, d.authenticated ? "authenticated" : "pending", d.member);
    return d;
  },
  /** ✅ Public */
  "referral.check": (referral_code: string) => publicGet<{ valid: boolean }>("/referral/check", 0, { referral_code: String(referral_code) }),

  /** ✅ Public — ช่องทางติดต่อเจ้าหน้าที่ */
  "contact.channels": () => publicGet<{ channels: ContactChannel[] }>("/contact/channels", 300),

  /* ───── Member / Credit (⚠️ response) ───── */
  "member.overview": () => get("/member/overview"),
  "member.profile": () => get("/member/profile"),
  "member.balance": () => get("/member/balance"),
  /** ดึงยอดล่าสุดจากผู้ให้บริการเกม (หนักกว่า /balance) */
  "member.loadBalance": () => get("/member/loadbalance"),

  /** ⚠️ เดา path/payload (Laravel รูปแบบ password_confirmation) — ต้องยืนยันกับ backend */
  "member.changePassword": (current_password: string, password: string, password_confirmation: string) =>
    post("/member/password", { current_password: String(current_password), password: String(password), password_confirmation: String(password_confirmation) }),

  /* ───── Game ───── */
  /** ⚠️ คาดว่าได้ url สำหรับเปิดเกม */
  "game.login": (body: Dict = {}) => post("/game/login", body),

  /* ───── Realtime (WebSocket) ───── */
  "realtime.config": () => get("/realtime/config"),
  /** ✅ */
  "realtime.auth": (socket_id: string, channel_name: string) => post("/realtime/auth", { socket_id: String(socket_id), channel_name: String(channel_name) }),

  /* ───── Promotion (⚠️ body) ───── */
  "promotion.list": () => get("/promotion/list"),
  "promotion.select": (code: string | number) => post("/promotion/select", { promotion: Number(code) }),
  "promotion.deselect": () => post("/promotion/deselect"),

  /* ───── Deposit (⚠️ body) ───── */
  "deposit.channels": () => get("/deposit/channels"),
  /** ✅ method: bank | tw | payment | slip */
  "deposit.select": (method: string, bank_code?: number) => post("/deposit/select", { method, ...(bank_code ? { bank_code } : {}) }),
  /** ✅ รองรับ bank | tw | slip (payment ใช้ select) */
  "deposit.selectRandom": (method: string, bank_code?: number) => post("/deposit/select/random", { method, ...(bank_code ? { bank_code } : {}) }),
  /** ✅ สร้างรายการชำระเงิน (provider adminpay) → checkout_url */
  "deposit.createPayment": (amount: number, idempotencyKey: string, provider = "adminpay") =>
    post("/deposit/payment/create", { provider, amount: String(amount) }, idempotencyKey),
  "deposit.paymentStatus": (txid?: string) => get("/deposit/payment/status", { txid }),

  /* ───── Withdraw ───── */
  "withdraw.eligibility": () => get("/withdraw/eligibility"),
  "withdraw.quote": (amount: number) => post("/withdraw/quote", { amount: String(amount) }),
  /** ✅ X-Idempotency-Key ต้องคงเดิมถ้าผลไม่แน่ชัด (timeout) */
  "withdraw.submit": (amount: number, idempotencyKey: string) => post("/withdraw/submit", { amount: String(amount) }, idempotencyKey),

  /* ───── Transactions (⚠️ response) ───── */
  /** ✅ cursor: ส่ง before = next_before ของหน้าก่อน */
  "transactions.deposits": (before?: number | string, limit = 20) => get("/transactions/deposits", { limit, before }),
  /** ✅ mode จำเป็น: standard | free | seamless | seamless_free */
  "transactions.withdrawals": (mode: string, before?: number | string, limit = 20) => get("/transactions/withdrawals", { mode, limit, before }),

  /* ───── Wheel (⚠️) ───── */
  "wheel.list": () => get("/wheel/list"),
  "wheel.history": () => get("/wheel/history"),
  "wheel.spin": (idempotencyKey: string) => post("/wheel/spin", {}, idempotencyKey),

  /* ───── Coupon (⚠️) ───── */
  "coupon.my": () => get("/coupon/my"),
  "coupon.redeem": (coupon: string) => post("/coupon/redeem", { coupon }),
  /** ✅ code = รหัสรายการโบนัสของสมาชิก (ไม่ใช่ชื่อคูปอง) · ผลไม่แน่ชัดห้ามส่งซ้ำ */
  "coupon.claim": (code: string) => post(`/coupon/my/${encodeURIComponent(String(code))}/claim`, {}),

  /* ───── Reward (⚠️) ───── */
  "reward.list": () => get("/reward/list"),
  "reward.history": (page = 1) => get("/reward/history", { page }),
  "reward.redeem": (code: string | number, idempotencyKey: string) => post("/reward/redeem", { reward_id: Number(code) }, idempotencyKey),

  /* ───── Bonus wallet (✅) ───── */
  "bonus.wallet": () => get<BonusWallet>("/bonus/wallet"),
  /** ✅ โยก BONUS ทั้งหมด — key เดิมถ้าผลไม่แน่ชัด */
  "bonus.transfer": (idempotencyKey: string) => post<BonusTransferResult>("/bonus/transfer", { source: "BONUS" }, idempotencyKey),

  /* ───── Referral (✅) ───── */
  "referral.overview": () => get<ReferralOverview>("/referral/overview"),
  "referral.members": (page = 1, per_page = 20) => get<Paged<ReferralMember>>("/referral/members", { page, per_page }),
  "referral.earnings": (page = 1, per_page = 20) => get<Paged<ReferralEarning>>("/referral/earnings", { page, per_page }),
};
