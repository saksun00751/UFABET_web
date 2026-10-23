"use client";
import * as React from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { Building2, CheckCircle2, Clock, Info, Loader2, QrCode, RefreshCw, Shuffle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { deposit, promotion } from "@/lib/api/member";
import {
  normalizeChannels,
  normalizeDepositAccount,
  normalizePayment,
  normalizePromotions,
  paymentState,
  type DepositAccount,
  type DepositChannel,
  type Payment,
} from "@/lib/api/normalize";
import { errorMessage } from "@/lib/api/errors";
import { baht, toNumber } from "@/lib/format";
import * as v from "@/lib/validate";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { WalletTabs } from "@/components/member/wallet-tabs";
import { AmountInput } from "@/components/amount-input";
import { CopyButton } from "@/components/copy-button";
import { QrImage } from "@/components/qr-image";
import { BankChip } from "@/components/bank-chip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DepositPage() {
  return (
    <AuthGuard>
      <Deposit />
    </AuthGuard>
  );
}

type Mode = "bank" | "qr";

function channelMode(c: DepositChannel): Mode {
  return /qr|promptpay|adminpay|payment|gateway/.test(`${c.type} ${c.name}`.toLowerCase()) ? "qr" : "bank";
}

function Deposit() {
  const { mutate: gm } = useSWRConfig();
  const channelsSWR = useSWR("deposit/channels", deposit.channels);
  const promoSWR = useSWR("promotion/list", promotion.list);
  const selectedPromo = normalizePromotions(promoSWR.data).items.find((p) => p.selected);

  const channels = normalizeChannels(channelsSWR.data);
  const options: { key: string; mode: Mode; name: string; desc: string; channel?: DepositChannel }[] = channels.length
    ? channels.map((c) => ({ key: c.id || c.name, mode: channelMode(c), name: c.name, desc: c.description ?? (channelMode(c) === "qr" ? "สร้าง QR อัตโนมัติ" : "โอนเข้าบัญชีรับฝาก"), channel: c }))
    : [
        { key: "bank", mode: "bank", name: "โอนผ่านธนาคาร", desc: "ระบบเลือกบัญชีรับฝากให้" },
        { key: "qr", mode: "qr", name: "QR พร้อมเพย์", desc: "สร้างรายการฝากอัตโนมัติ" },
      ];

  const [picked, setPicked] = React.useState<string | null>(null);
  const opt = options.find((o) => o.key === picked) ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title="กระเป๋าเงิน" />
      <WalletTabs active="deposit" />

      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">โปรโมชั่นที่เลือก</div>
            <div className="truncate font-semibold">{selectedPromo ? selectedPromo.title : "ไม่รับโปรโมชั่น"}</div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/promotions">{selectedPromo ? "เปลี่ยน" : "เลือกโปร"}</Link>
          </Button>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">ช่องทางฝาก</h2>
        {channelsSWR.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="ช่องทางฝาก">
            {options.map((o) => {
              const Icon = o.mode === "qr" ? QrCode : Building2;
              const on = o.key === picked;
              return (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPicked(o.key)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-3xl border-2 p-4 text-left transition-colors",
                    on ? "bg-soft border-primary" : "border-border bg-card hover:border-edge",
                  )}
                >
                  <Icon className="size-6 text-brand" />
                  <span className="font-semibold">{o.name}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{o.desc}</span>
                </button>
              );
            })}
          </div>
        )}
        {channelsSWR.error && <p className="text-sm text-destructive">{errorMessage(channelsSWR.error)}</p>}
      </section>

      {opt?.mode === "bank" && <BankTransfer key={opt.key} channel={opt.channel} />}
      {opt?.mode === "qr" && <QrPayment key={opt.key} channel={opt.channel} onPaid={() => gm("member/balance")} />}
    </div>
  );
}

function BankTransfer({ channel }: { channel?: DepositChannel }) {
  const [acc, setAcc] = React.useState<DepositAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (random = false) => {
      setLoading(true);
      setErr(null);
      try {
        const d = random || !channel?.id ? await deposit.selectRandom() : await deposit.select(channel.id);
        const a = normalizeDepositAccount(d);
        if (!a) throw new Error("NO_ACCOUNT");
        setAcc(a);
      } catch (e) {
        setErr(errorMessage(e, "ไม่พบบัญชีรับฝาก กรุณาลองใหม่"));
      } finally {
        setLoading(false);
      }
    },
    [channel?.id],
  );

  React.useEffect(() => {
    load(false);
  }, [load]);

  return (
    <Card className="bg-felt border-gold-2">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-deco text-[11px] font-bold tracking-[0.3em] text-gold-2">TRANSFER TO</div>
            <h2 className="font-display text-lg font-semibold text-ivory">โอนเข้าบัญชีนี้</h2>
          </div>
          <Button variant="felt" size="sm" onClick={() => load(true)} disabled={loading}>
            <Shuffle className="size-4" /> สุ่มบัญชีใหม่
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-20" />
        ) : err ? (
          <p className="text-destructive">{err}</p>
        ) : acc ? (
          <div className="flex items-center gap-3">
            <BankChip shortcode={acc.bankShort} className="size-12" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-ivory-muted">
                {acc.bankName} · {acc.accName}
              </div>
              <div className="text-foil font-deco text-2xl font-black tracking-wider">{acc.accNo}</div>
            </div>
            <CopyButton value={acc.accNo.replace(/\D/g, "")} label="คัดลอกเลขบัญชี" />
          </div>
        ) : null}
        {acc?.qr && (
          <div className="flex justify-center">
            <QrImage src={acc.qr} />
          </div>
        )}
        <div className="flex gap-2.5 text-sm leading-relaxed text-ivory-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-gold-2" />
          <span>โอนจากบัญชีที่ลงทะเบียนไว้เท่านั้น ระบบจะเติมเครดิตอัตโนมัติเมื่อตรวจพบยอดโอน (ยอดเงินอัปเดตแบบ realtime)</span>
        </div>
      </CardContent>
    </Card>
  );
}

function QrPayment({ channel, onPaid }: { channel?: DepositChannel; onPaid: () => void }) {
  const [amount, setAmount] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [touched, setTouched] = React.useState(false);
  const state = payment ? paymentState(payment.status) : null;
  const amountError = v.amount(amount, toNumber(amount));

  async function create() {
    setTouched(true);
    if (amountError) return;
    setBusy(true);
    try {
      const d = await deposit.createPayment(toNumber(amount), channel?.id || undefined);
      setPayment(normalizePayment(d));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // poll สถานะทุก 5 วินาที
  const poll = useSWR(payment && state === "pending" ? ["deposit/payment/status", payment.ref] : null, () => deposit.paymentStatus(payment?.ref), {
    refreshInterval: 5000,
  });
  React.useEffect(() => {
    if (!poll.data || !payment) return;
    const next = normalizePayment({ ...payment, ...poll.data });
    if (paymentState(next.status) !== paymentState(payment.status)) {
      setPayment((p) => (p ? { ...p, status: next.status } : p));
      if (paymentState(next.status) === "success") {
        toast.success("ฝากเงินสำเร็จ");
        onPaid();
      }
    }
  }, [poll.data, payment, onPaid]);

  if (!payment)
    return (
      <Card>
        <CardContent className="flex flex-col gap-4">
          <label htmlFor="dep-amount" className="font-display text-lg font-semibold">
            จำนวนเงินที่ต้องการฝาก
          </label>
          <AmountInput id="dep-amount" value={amount} onChange={setAmount} onBlur={() => setTouched(true)} error={touched ? amountError : undefined} />
          <Button size="lg" disabled={busy} onClick={create}>
            {busy && <Loader2 className="animate-spin" />} สร้างรายการฝาก {toNumber(amount) > 0 ? baht(amount) : ""}
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <Card className="bg-hero border-edge">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-lg font-semibold">สแกนเพื่อชำระเงิน</h2>
          <StatusBadge state={state!} />
        </div>
        <div className="text-foil font-deco text-4xl font-black">{baht(payment.amount || amount)}</div>
        {state === "pending" && (
          <>
            {payment.qrImage || payment.qrText ? (
              <QrImage src={payment.qrImage} text={payment.qrText} />
            ) : payment.payUrl ? (
              <Button asChild size="lg">
                <a href={payment.payUrl} target="_blank" rel="noreferrer">
                  ไปหน้าชำระเงิน
                </a>
              </Button>
            ) : null}
            {payment.expiresAt && <p className="text-sm text-muted-foreground">ชำระภายใน {new Date(payment.expiresAt).toLocaleTimeString("th-TH")}</p>}
            <Button variant="secondary" size="sm" onClick={() => poll.mutate()}>
              <RefreshCw className={cn("size-4", poll.isValidating && "animate-spin")} /> ตรวจสอบสถานะ
            </Button>
          </>
        )}
        {state !== "pending" && (
          <Button size="lg" className="w-full" onClick={() => setPayment(null)}>
            ทำรายการใหม่
          </Button>
        )}
        {payment.ref && <p className="text-xs text-muted-foreground">อ้างอิง {payment.ref}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ state }: { state: ReturnType<typeof paymentState> }) {
  if (state === "success")
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3.5" /> สำเร็จ
      </Badge>
    );
  if (state === "failed")
    return (
      <Badge variant="destructive">
        <XCircle className="size-3.5" /> ไม่สำเร็จ
      </Badge>
    );
  if (state === "expired") return <Badge variant="outline">หมดเวลา</Badge>;
  return (
    <Badge variant="warning">
      <Clock className="size-3.5" /> รอชำระเงิน
    </Badge>
  );
}
