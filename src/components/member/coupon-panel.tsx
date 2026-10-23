"use client";
import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { Loader2, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { coupon } from "@/lib/api/member";
import { normalizeCoupons } from "@/lib/api/normalize";
import { errorMessage } from "@/lib/api/errors";
import { thaiDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ARTS = ["linear-gradient(135deg,#FFC857,#6B2E00)", "linear-gradient(135deg,#7CCEFF,#0B2A5E)", "linear-gradient(135deg,#C79BFF,#2A0E55)"];

export function CouponPanel() {
  const { mutate: gm } = useSWRConfig();
  const my = useSWR("coupon/my", coupon.my);
  const items = normalizeCoupons(my.data);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setBusy("redeem");
    try {
      await coupon.redeem(code);
      toast.success("แลกคูปองสำเร็จ");
      setCode("");
      await Promise.all([my.mutate(), gm("member/balance")]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function claim(c: string) {
    setBusy(c);
    try {
      await coupon.claim(c);
      toast.success("รับคูปองสำเร็จ");
      await Promise.all([my.mutate(), gm("member/balance"), gm("bonus/wallet")]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="bg-hero border-edge h-fit">
        <CardContent>
          <form onSubmit={redeem} className="flex flex-col gap-3">
            <label htmlFor="coupon-code" className="font-display text-lg font-semibold">
              กรอกรหัสคูปอง
            </label>
            <div className="flex gap-2">
              <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value.trim().toUpperCase())} placeholder="เช่น LUCKY2026" className="bg-card tracking-widest" />
              <Button type="submit" disabled={!code || busy === "redeem"} className="h-13 rounded-2xl">
                {busy === "redeem" && <Loader2 className="animate-spin" />} แลก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">คูปองของฉัน</h2>
        {my.isLoading ? (
          <Skeleton className="h-28" />
        ) : my.error ? (
          <p className="text-destructive">{errorMessage(my.error)}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-muted-foreground">
            <TicketPercent className="size-9" /> ยังไม่มีคูปอง
          </div>
        ) : (
          items.map((c, i) => (
            <div key={c.code || i} className="flex overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex w-24 shrink-0 items-center justify-center p-2 text-center font-display text-xl font-bold text-white" style={{ background: ARTS[i % ARTS.length] }}>
                {c.value ? `฿${c.value}` : <TicketPercent className="size-8" />}
              </div>
              <div className="flex flex-1 flex-col gap-2 border-l-2 border-dashed border-border p-4">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.code} {c.expiresAt && `· หมดอายุ ${thaiDateTime(c.expiresAt)}`}
                  </div>
                </div>
                <Button size="sm" variant={c.claimable ? "soft" : "secondary"} className="self-start" disabled={!c.claimable || busy === c.code} onClick={() => claim(c.code)}>
                  {busy === c.code && <Loader2 className="animate-spin" />}
                  {c.claimable ? "รับคูปอง" : "ใช้แล้ว / หมดอายุ"}
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
