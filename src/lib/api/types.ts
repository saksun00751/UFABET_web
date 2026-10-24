/** Types ของ Member API v1 (✅ = ยืนยันจากเอกสาร) — ใช้ร่วมกันทั้ง server และ client */
/* ───────────── Types (✅ ตามเอกสาร) ───────────── */
export type Member = { code: number; user_name: string };
export type Bank = { code: number; name_th: string; name_en: string; shortcode: string };

export type BankNameResult = {
  bank: number;
  acc_no: string;
  bank_shortcode: string;
  account_name: string;
  firstname: string;
  lastname: string;
  lookup_succeeded: boolean;
  can_prefill: boolean;
};

export type RegisterPayload = {
  user_name: string; // เบอร์โทร
  firstname: string;
  lastname: string;
  bank: number;
  acc_no: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
};

export type RegisterResult = {
  status: "REGISTERED";
  authenticated: boolean;
  game_account_status: "READY" | "REQUIRES_REVIEW";
  csrf_token: string;
  member: Member;
};

export type PreflightResult = { status: "PREFLIGHT_OK"; registration_api_available: boolean; uniqueness_reserved: boolean };

export type LoginResult = { status: "AUTHENTICATED"; authenticated: boolean; csrf_token: string; member: Member };
export type MeResult = { authenticated: boolean; member?: Member };

export type BonusWallet = {
  source: "BONUS";
  wheel_bonus: string;
  cashback: string;
  ic: string;
  faststart: string;
  transfer_all: boolean;
  eligible: boolean;
  pending_reconciliation: boolean;
  latest_transfer: unknown;
};

export type BonusTransferResult = {
  status: "TRANSFERRED" | string;
  source: "BONUS";
  amount: string;
  bonus_remaining: string;
  game_balance: string;
  provider_tx_id: string;
  ref_id: string;
  bill_code: number;
  idempotency_replayed: boolean;
};

export type ReferralOverview = {
  referral_code: string;
  referral_link: string | null;
  referral_path: string;
  direct_members: number;
  active_direct_members: number;
  commission_percent: string;
  commission_enabled: boolean;
  commission_type: "PERCENT" | "FIXED" | string;
  commission_fixed_amount: string;
  commission_display: string;
  earned_total: string;
  earning_transactions: number;
  available_faststart: string;
  earnings_source: string;
};

export type ReferralMember = { member_code: number; username_masked: string; registered_at: string; status: string };
export type ReferralEarning = {
  transaction_id: string | number;
  referred_member_code: number;
  username_masked: string;
  qualifying_amount: string;
  earned_amount: string;
  created_at: string;
};
export type Paged<T> = { items?: T[]; data?: T[]; total: number; page: number; per_page: number; has_more: boolean };

export type ContactChannel = { code: string | number; type: string; label: string; link: string; sort: number };
