import "server-only";
import { readSession, writeSession, clearSession } from "../session-store";
import { apiFetch, call, freshBackend, publicGet, type Backend } from "./server";
import type {
  Bank, BankNameResult, BonusTransferResult, BonusWallet, LoginResult, MeResult, Paged, PreflightResult, ReferralEarning,
  ReferralMember, ReferralOverview, RegisterPayload, RegisterResult,
} from "./types";

/**
 * ===== Endpoint map (Member API v1) — 43 เส้น =====
 * เป็นรายการเดียวที่ browser เรียกได้ (ผ่าน Server Action `invoke` ใน app/actions/api.ts)
 * แก้ path/payload ที่นี่ที่เดียว · ฟังก์ชันที่แก้ session (login, register, logout) ก็อยู่ที่นี่
 *
 * ✅ = schema ยืนยันจากเอกสาร · ⚠️ = เดาจากระบบเดิม ต้องยืนยันกับ backend
 */
type Dict = Record<string, unknown>;

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
  "register.preflight": (p: RegisterPayload) => post<PreflightResult>("/register/preflight", p),
  /** ✅ ใช้ session เดียวกับ preflight แล้วอัปเดตสถานะตามผล */
  async "register.submit"(p: RegisterPayload) {
    const s = await readSession();
    const state: Backend = { jar: { ...(s?.jar ?? {}) }, csrf: s?.csrf };
    const d = await call<RegisterResult>("/register", { method: "POST", body: p }, state);
    await commit(state, d.authenticated ? "authenticated" : "pending", d.member);
    return d;
  },
  /** ✅ Public */
  "referral.check": (referral_code: string) => publicGet<{ valid: boolean }>("/referral/check", 0, { referral_code: String(referral_code) }),

  /* ───── Member / Credit (⚠️ response) ───── */
  "member.overview": () => get("/member/overview"),
  "member.profile": () => get("/member/profile"),
  "member.balance": () => get("/member/balance"),
  /** ดึงยอดล่าสุดจากผู้ให้บริการเกม (หนักกว่า /balance) */
  "member.loadBalance": () => get("/member/loadbalance"),

  /* ───── Game ───── */
  /** ⚠️ คาดว่าได้ url สำหรับเปิดเกม */
  "game.login": (body: Dict = {}) => post("/game/login", body),

  /* ───── Realtime (WebSocket) ───── */
  "realtime.config": () => get("/realtime/config"),
  /** ✅ */
  "realtime.auth": (socket_id: string, channel_name: string) => post("/realtime/auth", { socket_id: String(socket_id), channel_name: String(channel_name) }),

  /* ───── Promotion (⚠️ body) ───── */
  "promotion.list": () => get("/promotion/list"),
  "promotion.select": (code: string | number) => post("/promotion/select", { pro_code: code, code }),
  "promotion.deselect": () => post("/promotion/deselect"),

  /* ───── Deposit (⚠️ body) ───── */
  "deposit.channels": () => get("/deposit/channels"),
  "deposit.select": (channel: string | number) => post("/deposit/select", { channel, code: channel }),
  "deposit.selectRandom": () => post("/deposit/select/random"),
  "deposit.createPayment": (amount: number, idempotencyKey: string, channel?: string | number) =>
    post("/deposit/payment/create", { amount: String(amount), channel }, idempotencyKey),
  "deposit.paymentStatus": (ref?: string) => get("/deposit/payment/status", { ref, id: ref }),

  /* ───── Withdraw ───── */
  "withdraw.eligibility": () => get("/withdraw/eligibility"),
  "withdraw.quote": (amount: number) => post("/withdraw/quote", { amount: String(amount) }),
  /** ✅ X-Idempotency-Key ต้องคงเดิมถ้าผลไม่แน่ชัด (timeout) */
  "withdraw.submit": (amount: number, idempotencyKey: string) => post("/withdraw/submit", { amount: String(amount) }, idempotencyKey),

  /* ───── Transactions (⚠️ response) ───── */
  "transactions.deposits": (page = 1, per_page = 20) => get("/transactions/deposits", { page, per_page }),
  "transactions.withdrawals": (page = 1, per_page = 20) => get("/transactions/withdrawals", { page, per_page }),

  /* ───── Wheel (⚠️) ───── */
  "wheel.list": () => get("/wheel/list"),
  "wheel.history": (page = 1) => get("/wheel/history", { page }),
  "wheel.spin": (idempotencyKey: string, wheel_code?: string | number) => post("/wheel/spin", { wheel_code, code: wheel_code }, idempotencyKey),

  /* ───── Coupon (⚠️) ───── */
  "coupon.my": () => get("/coupon/my"),
  "coupon.redeem": (code: string, idempotencyKey: string) => post("/coupon/redeem", { code }, idempotencyKey),
  "coupon.claim": (code: string, idempotencyKey: string) => post(`/coupon/my/${encodeURIComponent(String(code))}/claim`, {}, idempotencyKey),

  /* ───── Reward (⚠️) ───── */
  "reward.list": () => get("/reward/list"),
  "reward.history": (page = 1) => get("/reward/history", { page }),
  "reward.redeem": (code: string | number, idempotencyKey: string) => post("/reward/redeem", { reward_code: code, code }, idempotencyKey),

  /* ───── Bonus wallet (✅) ───── */
  "bonus.wallet": () => get<BonusWallet>("/bonus/wallet"),
  /** ✅ โยก BONUS ทั้งหมด — key เดิมถ้าผลไม่แน่ชัด */
  "bonus.transfer": (idempotencyKey: string) => post<BonusTransferResult>("/bonus/transfer", { source: "BONUS" }, idempotencyKey),

  /* ───── Referral (✅) ───── */
  "referral.overview": () => get<ReferralOverview>("/referral/overview"),
  "referral.members": (page = 1, per_page = 20) => get<Paged<ReferralMember>>("/referral/members", { page, per_page }),
  "referral.earnings": (page = 1, per_page = 20) => get<Paged<ReferralEarning>>("/referral/earnings", { page, per_page }),
};
