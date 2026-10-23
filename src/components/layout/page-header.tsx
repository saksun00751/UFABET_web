"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const KICKERS: Record<string, string> = {
  "กระเป๋าเงิน": "THE CASHIER",
  "ประวัติฝาก-ถอน": "THE LEDGER",
  "บัญชีของฉัน": "MEMBER'S SUITE",
  "รางวัล & โบนัส": "LUCKY REWARDS",
  "โปรโมชั่น & โบนัส": "VIP PRIVILEGES",
  "แนะนำเพื่อน": "INVITE A GUEST",
};

export function PageHeader({ title, kicker, back = true, right }: { title: string; kicker?: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  const k = kicker ?? KICKERS[title];
  return (
    <div className="flex items-end gap-3 py-4">
      {back && (
        <Button variant="outline" size="icon" aria-label="กลับ" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
      )}
      <div className="flex-1">
        {k && <div className="font-deco text-xs font-bold tracking-[0.3em] text-brand">{k}</div>}
        <h1 className="font-display text-2xl leading-snug font-bold lg:text-3xl">{title}</h1>
      </div>
      {right}
    </div>
  );
}
