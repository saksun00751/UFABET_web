"use client";
import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reward } from "@/lib/api/member";
import { normalizeRewards } from "@/lib/api/normalize";
import { asList, pickStr } from "@/lib/api/shape";
import { errorMessage } from "@/lib/api/errors";
import { thaiDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ARTS = ["linear-gradient(135deg,#FFC857,#6B2E00)", "linear-gradient(135deg,#55F0C8,#063F3A)", "linear-gradient(135deg,#FF8FB8,#5E0F35)", "linear-gradient(135deg,#C79BFF,#2A0E55)"];

export function RewardPanel() {
  const { mutate: gm } = useSWRConfig();
  const list = useSWR("reward/list", reward.list);
  const hist = useSWR("reward/history", () => reward.history(1));
  const { items, points } = normalizeRewards(list.data);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function redeem(id: string) {
    setBusy(id);
    try {
      await reward.redeem(id);
      toast.success("แลกรางวัลสำเร็จ");
      await Promise.all([list.mutate(), hist.mutate(), gm("member/balance")]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const history = asList(hist.data).map((h) => ({
    name: pickStr(h, ["reward_name", "name", "title"]) || items.find((r) => r.id === pickStr(h, ["reward_id"]))?.title || "ของรางวัล",
    at: pickStr(h, ["created_at", "date"]),
    status: pickStr(h, ["status"]),
  }));

  return (
    <div className="flex flex-col gap-5">
      {points && (
        <div className="flex items-center justify-between rounded-3xl border border-edge bg-card px-5 py-4">
          <span className="text-muted-foreground">แต้มสะสมของคุณ</span>
          <span className="font-display text-2xl font-bold text-brand">{points}</span>
        </div>
      )}
      {list.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-10 text-muted-foreground">
          <Gift className="size-10" /> ยังไม่มีของรางวัล
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {items.map((r, i) => (
            <article key={r.id || i} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
              <div className="relative flex aspect-[4/3] items-center justify-center" style={r.image ? undefined : { background: ARTS[i % ARTS.length] }}>
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <Gift className="size-10 text-white" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <div className="text-sm leading-snug font-semibold">{r.title}</div>
                {r.cost && <div className="text-xs text-muted-foreground">ใช้ {r.cost} แต้ม</div>}
                <Button size="sm" className="mt-auto" disabled={!r.available || busy === r.id} onClick={() => redeem(r.id)}>
                  {busy === r.id && <Loader2 className="animate-spin" />} แลกรางวัล
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {history.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-lg font-semibold">ประวัติการแลก</h2>
          {history.slice(0, 10).map((h, i) => (
            <div key={i} className="flex justify-between rounded-3xl border border-border bg-card px-4 py-3">
              <span className="font-semibold">{h.name}</span>
              <span className="text-sm text-muted-foreground">{thaiDateTime(h.at)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
