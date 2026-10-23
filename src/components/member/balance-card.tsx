"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { useBalance } from "@/hooks/use-member";
import { baht, maskPhone } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SpadeIcon } from "@/components/casino/icons";
import { cn } from "@/lib/utils";

/** บัตร VIP: กรอบทองฟอยล์ + พื้นโต๊ะเข้ม */
export function BalanceCard({ className }: { className?: string }) {
  const { member } = useAuth();
  const { balance, isLoading, sync, syncing } = useBalance();
  return (
    <div className={cn("foil-frame rounded-[1.75rem] shadow-2xl", className)}>
      <div className="bg-felt flex h-full flex-col gap-4 rounded-[calc(1.75rem-3px)] p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="font-deco text-[11px] font-bold tracking-[0.3em] text-gold-2">VIP MEMBER</span>
          <div className="flex items-center gap-2">
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
        <div>
          <div className="text-sm text-ivory-muted">ยอดเงินคงเหลือ</div>
          <div className="text-foil font-deco text-4xl leading-tight font-black tabular-nums sm:text-5xl">{isLoading ? "…" : baht(balance)}</div>
          <div className="font-deco text-sm tracking-[0.18em] text-ivory-muted">
            {maskPhone(member?.user_name)} · Nº {member?.code}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3">
          <Button asChild>
            <Link href="/deposit">ฝากเงิน</Link>
          </Button>
          <Button asChild variant="felt">
            <Link href="/withdraw">ถอนเงิน</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
