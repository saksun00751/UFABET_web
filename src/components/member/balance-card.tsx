"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { useBalance, useProfile } from "@/hooks/use-member";
import { baht, maskPhone } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SpadeIcon } from "@/components/casino/icons";
import { pickStr } from "@/lib/api/shape";
import { cn } from "@/lib/utils";

/** บัตร VIP: กรอบทองฟอยล์ + พื้นโต๊ะเข้ม */
export function BalanceCard({ className, showPhone = true, showMember = true }: { className?: string; showPhone?: boolean; showMember?: boolean }) {
  const { member } = useAuth();
  const { balance, isLoading, sync, syncing } = useBalance();
  const { data: profile } = useProfile();
  const name = pickStr(profile, ["profile.name"]);
  const bankName = pickStr(profile, ["profile.bank.name_th"]);
  const accNo = pickStr(profile, ["profile.bank.account_masked"]);
  const stats = [
    { k: "แต้ม", v: pickStr(profile, ["profile.rewards.points"]) },
    { k: "เพชร", v: pickStr(profile, ["profile.rewards.diamonds"]) },
    { k: "แคชแบ็ก", v: pickStr(profile, ["profile.rewards.cashback"]) },
  ].filter((r) => r.v);
  return (
    <div className={cn("foil-frame rounded-[1.75rem] shadow-2xl", className)}>
      <div className="bg-felt flex h-full flex-col gap-4 rounded-[calc(1.75rem-3px)] p-5 sm:p-6">
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            {showMember && name && <div className="truncate font-display text-lg font-bold text-ivory sm:text-xl">{name}</div>}
            <div className="text-sm text-ivory-muted">ยอดเงินคงเหลือ</div>
            <div className="text-foil font-deco text-3xl leading-tight font-black tabular-nums sm:text-4xl">{isLoading ? "…" : baht(balance)}</div>
            {showPhone && <div className="font-deco text-sm tracking-[0.18em] text-ivory-muted">{maskPhone(member?.user_name)}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={sync}
              aria-label="ดึงยอดล่าสุดจากเกม"
              className="flex size-10 items-center justify-center rounded-full border border-gold-2 text-gold-2 hover:bg-white/5"
            >
              <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            </button>
            <SpadeIcon className="size-7 text-gold-2" />
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-4">
          {showMember && accNo && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold-2/40 px-3 py-2.5">
              <span className="truncate text-sm text-ivory-muted">{bankName || "บัญชีธนาคาร"}</span>
              <span className="font-deco text-base font-bold tracking-wider text-gold-1">{accNo}</span>
            </div>
          )}
          {showMember && stats.length > 0 && (
            <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-gold-2/40 px-3 py-2.5 text-center">
              {stats.map(({ k, v }) => (
                <div key={k}>
                  <dt className="text-xs text-ivory-muted">{k}</dt>
                  <dd className="font-deco text-base font-bold text-gold-1 tabular-nums">{baht(v, false)}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button asChild>
              <Link href="/deposit">ฝากเงิน</Link>
            </Button>
            <Button asChild variant="felt">
              <Link href="/withdraw">ถอนเงิน</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
