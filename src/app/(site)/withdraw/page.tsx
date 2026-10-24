"use client";
import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { withdraw } from "@/lib/api/member";
import { pick, pickStr } from "@/lib/api/shape";
import { ApiError } from "@/lib/api/client";
import { errorMessage, reasonText } from "@/lib/api/errors";
import { useAuth } from "@/components/providers/auth";
import { useBalance, useProfile } from "@/hooks/use-member";
import { useIdempotentKey } from "@/hooks/use-idempotent";
import { baht, maskPhone, toNumber } from "@/lib/format";
import * as v from "@/lib/validate";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { WalletTabs } from "@/components/member/wallet-tabs";
import { AmountInput } from "@/components/amount-input";
import { BankChip } from "@/components/bank-chip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WithdrawPage() {
  return (
    <AuthGuard>
      <Withdraw />
    </AuthGuard>
  );
}

const NOT_VERIFIED = "PROVIDER_BALANCE_NOT_VERIFIED";
const NOT_VERIFIED_RETRY_MS = 5_000;
const NOT_VERIFIED_MAX_RETRIES = 12;

function Withdraw() {
  const { mutate: gm } = useSWRConfig();
  const { balance } = useBalance();
  const profile = useProfile();
  const { member } = useAuth();
  const elig = useSWR("withdraw/eligibility", withdraw.eligibility);
  const idem = useIdempotentKey("wd");

  const e = elig.data;
  const eligible = !elig.error && Boolean(pick(e, ["can_submit_withdrawal", "eligible", "can_withdraw", "allowed"], true));
  const reasons = (pick<unknown[]>(e, ["reasons"]) ?? []).map((r) => reasonText(String(r)));
  const reason = (elig.error ? errorMessage(elig.error) : "") || reasons.join(" · ") || reasonText(pickStr(e, ["reason", "message", "reason_th", "blocked_reason"]));
  // backend ยังยืนยันยอดฝั่ง provider ไม่ได้ → ลองเรียก eligibility ใหม่เอง (สูงสุด NOT_VERIFIED_MAX_RETRIES ครั้ง)
  const notVerified =
    (elig.error instanceof ApiError && elig.error.code === NOT_VERIFIED) ||
    [...(pick<unknown[]>(e, ["reasons"]) ?? []).map(String), pickStr(e, ["reason", "blocked_reason", "code"])].includes(NOT_VERIFIED);
  const retries = React.useRef(0);
  const { mutate: revalidateElig } = elig;
  React.useEffect(() => {
    if (!notVerified) {
      retries.current = 0;
      return;
    }
    const t = setInterval(() => {
      if (retries.current >= NOT_VERIFIED_MAX_RETRIES) return clearInterval(t);
      retries.current += 1;
      revalidateElig();
    }, NOT_VERIFIED_RETRY_MS);
    return () => clearInterval(t);
  }, [notVerified, revalidateElig]);
  const min = toNumber(pick(e, ["min", "min_withdraw", "minimum", "limits.min"], 0));
  const max = toNumber(pick(e, ["max", "max_withdraw", "maximum", "limits.max", "daily_remaining"], 0));
  const available = toNumber(pick(e, ["available", "withdrawable", "amount_available", "balance"], balance));
  const turnNeed = toNumber(pick(e, ["turnover_required", "turnover.target", "turn_target"], 0));
  const turnDone = toNumber(pick(e, ["turnover_current", "turnover.current", "turn_current"], 0));
  const timesLeft = pick<number>(e, ["remaining_count", "times_left", "remaining_today"]);

  const bankSrc = pick(e, ["bank", "account"]) ?? profile.data;
  const bankShort = pickStr(bankSrc, ["bank_shortcode", "shortcode", "bank.shortcode", "profile.bank.shortcode", "bank_code"]);
  const bankName = pickStr(bankSrc, ["bank_name", "name_th", "bank.name_th", "profile.bank.name_th"]);
  const accNo = pickStr(bankSrc, ["account_masked", "acc_no_masked", "bank.account_masked", "profile.bank.account_masked", "acc_no", "account_no"]);
  const accName = pickStr(bankSrc, ["account_name", "acc_name", "profile.name", "name"]) ||
    [pickStr(profile.data, ["firstname"]), pickStr(profile.data, ["lastname"])].filter(Boolean).join(" ");
  const memberCode = pickStr(profile.data, ["profile.code"], member?.code ? String(member.code) : "");
  const memberPhone = maskPhone(member?.user_name);
  const details = [
    { label: "รหัสสมาชิก", value: memberCode },
    { label: "เบอร์โทร", value: memberPhone },
    { label: "ธนาคาร", value: bankName || bankShort },
  ].filter((d) => d.value);

  const [amount, setAmount] = React.useState("");
  const amt = toNumber(amount);
  const [quote, setQuote] = React.useState<{ fee: number; net: number; note?: string; tone?: "warning" | "error" } | null>(null);
  const [quoting, setQuoting] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    setQuote(null);
    if (amt <= 0) return;
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        const q = await withdraw.quote(amt);
        setQuote({
          fee: toNumber(pick(q, ["fee", "charge", "fee_amount"], 0)),
          net: toNumber(pick(q, ["net", "net_amount", "receive", "amount_receive", "amount"], amt)),
          note: (pick(q, ["can_submit_withdrawal"], true) ? undefined : (pick<unknown[]>(q, ["reasons"]) ?? []).map((r) => reasonText(String(r))).join(" · ")) || reasonText(pickStr(q, ["message", "note"])) || undefined,
        });
      } catch (err) {
        setQuote({ fee: 0, net: amt, note: errorMessage(err), tone: "error" });
      } finally {
        setQuoting(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [amt]);

  const amountError = v.amount(amount, amt, { min, max, available });
  const invalid = Boolean(amountError);

  async function submit() {
    setBusy(true);
    try {
      await withdraw.submit(amt, idem.current());
      idem.settle();
      toast.success("แจ้งถอนเรียบร้อย", { description: "ระบบกำลังดำเนินการโอนเงินเข้าบัญชีของคุณ" });
      setConfirm(false);
      setAmount("");
      setTouched(false);
      await Promise.all([gm("member/balance"), elig.mutate()]);
    } catch (err) {
      idem.settle(err);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title="กระเป๋าเงิน" />
      <WalletTabs active="withdraw" />

      {elig.isLoading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : (
        <Card className="bg-felt border-gold-2">
          <CardContent className="flex flex-col gap-3">
            <div className="font-deco text-[11px] font-bold tracking-[0.3em] text-gold-2">AVAILABLE · ยอดที่ถอนได้</div>
            <div className="text-foil font-deco text-4xl font-black tabular-nums">{baht(available)}</div>
            {turnNeed > 0 && (
              <>
                <div className="flex justify-between text-sm text-ivory-muted">
                  <span>เทิร์นโอเวอร์</span>
                  <span>
                    <b className="text-gold-1">{baht(turnDone)}</b> / {baht(turnNeed)}
                  </span>
                </div>
                <Progress value={Math.min(100, (turnDone / turnNeed) * 100)} />
              </>
            )}
            {!eligible && (
              <div role="alert" className="flex gap-2 rounded-2xl border-2 border-warning bg-warning/15 p-3 text-sm font-semibold text-warning">
                <AlertTriangle className="size-5 shrink-0" /> {reason || "ยังไม่สามารถถอนได้ในขณะนี้"}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label htmlFor="wd-amount" className="font-display text-lg font-semibold">
              จำนวนเงินที่ต้องการถอน
            </label>
            <Button variant="outline" size="sm" onClick={() => setAmount(String(Math.floor(max > 0 ? Math.min(available, max) : available)))}>
              ถอนทั้งหมด
            </Button>
          </div>
          <AmountInput id="wd-amount" value={amount} onChange={setAmount} onBlur={() => setTouched(true)} error={touched ? amountError : undefined} chips={[]} />
          <p className="text-sm text-muted-foreground">
            {min > 0 && <>ถอนขั้นต่ำ {baht(min)} </>}
            {max > 0 && <>· สูงสุด {baht(max)} </>}
            {timesLeft !== undefined && <>· เหลือ {timesLeft} ครั้งวันนี้</>}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">ถอนเข้าบัญชี</h2>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3.5">
            <BankChip shortcode={bankShort} />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">{bankName || "บัญชีที่ลงทะเบียน"}</div>
              <div className="truncate font-semibold">{accName || "—"}</div>
              <div className="font-deco text-sm tracking-wider text-muted-foreground">{accNo || "—"}</div>
            </div>
            <CheckCircle2 className="size-5 text-brand" />
          </div>
          {details.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl border border-border p-3.5 text-sm">
              {details.map((d) => (
                <div key={d.label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{d.label}</dt>
                  <dd className="truncate font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-xs text-muted-foreground">ถอนได้เฉพาะเข้าบัญชีที่ลงทะเบียนไว้เท่านั้น หากข้อมูลไม่ถูกต้องกรุณาติดต่อเจ้าหน้าที่</p>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">ค่าธรรมเนียม</span>
            <span>{quoting ? "…" : baht(quote?.fee ?? 0)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>ยอดที่จะได้รับ</span>
            <span className="font-display text-brand">{quoting ? "…" : baht(quote?.net ?? amt)}</span>
          </div>
          {quote?.note && (
            <div
              role="alert"
              className={`flex gap-2 rounded-2xl border-2 p-3 text-sm font-semibold ${quote.tone === "error" ? "border-destructive bg-destructive/15 text-destructive" : "border-warning bg-warning/15 text-warning"}`}
            >
              <AlertTriangle className="size-5 shrink-0" /> {quote.note}
            </div>
          )}
        </CardContent>
      </Card>

      {idem.uncertain && (
        <div role="alert" className="flex gap-2 rounded-2xl border-2 border-warning bg-warning/15 p-4 text-sm font-semibold text-warning">
          <ShieldAlert className="size-5 shrink-0" />
          ยังไม่ทราบผลการถอนล่าสุด เงินอาจถูกหักแล้ว — กรุณาตรวจสอบที่หน้าประวัติก่อน หากกดยืนยันอีกครั้งระบบจะใช้รายการเดิม (ไม่ถอนซ้ำ)
        </div>
      )}

      <Button
        size="lg"
        disabled={!eligible || quoting}
        onClick={() => {
          setTouched(true);
          if (!invalid) setConfirm(true);
        }}
      >
        ยืนยันการถอน
      </Button>

      <Dialog open={confirm} onOpenChange={(o) => !busy && setConfirm(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการถอนเงิน</DialogTitle>
            <DialogDescription>ตรวจสอบยอดและบัญชีปลายทางก่อนยืนยัน</DialogDescription>
          </DialogHeader>
          <div className="rounded-3xl bg-secondary p-5 text-center">
            <div className="text-sm text-muted-foreground">ยอดที่จะได้รับ</div>
            <div className="font-display text-4xl font-bold text-brand">{baht(quote?.net ?? amt)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              เข้าบัญชี {bankName || bankShort} {accNo}
            </div>
            {accName && <div className="text-sm font-medium">{accName}</div>}
          </div>
          <Button size="lg" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} ยืนยันถอน {baht(amt)}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
