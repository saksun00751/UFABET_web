"use client";
import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { promotion } from "@/lib/api/member";
import { normalizePromotions } from "@/lib/api/normalize";
import { errorMessage } from "@/lib/api/errors";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PromoCard } from "@/components/member/promo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift } from "lucide-react";

export default function PromotionsPage() {
  return (
    <AuthGuard>
      <Promotions />
    </AuthGuard>
  );
}

function Promotions() {
  const { data, isLoading, error, mutate } = useSWR("promotion/list", promotion.list);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const { items } = normalizePromotions(data);

  async function run(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      await mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="โปรโมชั่น" />
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-[1.75rem]" />
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">{errorMessage(error)}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <Gift className="size-10" />
          ยังไม่มีโปรโมชั่นในขณะนี้
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">เลือกโปรโมชั่นก่อนฝากเงิน ระบบจะคำนวณโบนัสให้อัตโนมัติเมื่อยอดฝากเข้า</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <PromoCard
                key={p.id || i}
                promo={p}
                index={i}
                busy={busyId === p.id}
                onSelect={() => run(p.id, () => promotion.select(p.id), `เลือก “${p.title}” แล้ว`)}
                onDeselect={() => run(p.id, () => promotion.deselect(), "ยกเลิกโปรโมชั่นแล้ว")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
