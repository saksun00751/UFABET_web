"use client";
import { RefreshCw } from "lucide-react";
import { useBalance } from "@/hooks/use-member";
import { baht } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BalancePill({ className }: { className?: string }) {
  const { balance, isLoading, sync, syncing } = useBalance();
  return (
    <button
      type="button"
      onClick={sync}
      className={cn("flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gold-2 bg-card px-4 font-deco font-bold text-brand", className)}
      aria-label="อัปเดตยอดเงิน"
    >
      <span className="tabular-nums">{isLoading ? "…" : baht(balance)}</span>
      <RefreshCw className={cn("size-4 opacity-70", syncing && "animate-spin")} />
    </button>
  );
}
