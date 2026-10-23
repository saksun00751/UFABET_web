"use client";
import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { wheel as wheelApi } from "@/lib/api/member";
import { normalizeSpin, normalizeWheels, type Wheel } from "@/lib/api/normalize";
import { asList, pickStr } from "@/lib/api/shape";
import { errorMessage } from "@/lib/api/errors";
import { thaiDateTime } from "@/lib/format";
import { BonusWalletCard } from "./bonus-wallet-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SEG = ["var(--felt-1)", "var(--g2)"];
const SEG_TEXT = ["var(--g1)", "#1A1206"];

function WheelDisc({ w, rotation, spinning }: { w: Wheel; rotation: number; spinning: boolean }) {
  const prizes: { label: string; color?: string }[] = w.prizes.length ? w.prizes : Array.from({ length: 8 }, () => ({ label: "?" }));
  const n = prizes.length;
  const step = 360 / n;
  const bg = `conic-gradient(${prizes.map((p, i) => `${p.color || SEG[i % SEG.length]} ${i * step}deg ${(i + 1) * step}deg`).join(",")})`;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <div className="bg-foil glow absolute inset-0 rounded-full p-3">
        <div className="pointer-events-none absolute inset-1 rounded-full" style={{ background: "radial-gradient(circle, #FFF8DC 0 2px, transparent 2.5px) 0 0/22px 22px", maskImage: "radial-gradient(circle, transparent 66%, #000 67%)", WebkitMaskImage: "radial-gradient(circle, transparent 66%, #000 67%)" }} aria-hidden="true" />
        <div
          className="relative size-full rounded-full border-4 border-felt"
          style={{
            background: bg,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.2s cubic-bezier(.17,.67,.12,.99)" : "none",
          }}
        >
          <span className="bg-foil chip absolute top-1/2 left-1/2 z-10 flex size-16 items-center justify-center font-deco text-xs font-black text-primary-foreground" style={{ ["--chip-gap" as string]: "var(--felt)", transform: `translate(-50%,-50%) rotate(${-rotation}deg)`, transition: spinning ? "transform 4.2s cubic-bezier(.17,.67,.12,.99)" : "none" }} aria-hidden="true">
            SPIN
          </span>
          {prizes.map((p, i) => (
            <span key={i} className="absolute top-1/2 left-1/2 size-0" style={{ transform: `rotate(${i * step + step / 2}deg)` }}>
              <span className="absolute left-[-36px] w-[72px] text-center font-deco text-sm font-black" style={{ top: "-118px", color: p.color ? "#fff" : SEG_TEXT[i % 2] }}>
                {p.label}
              </span>
            </span>
          ))}
        </div>
      </div>
      <span
        className="absolute -top-2 left-1/2 -ml-3.5 size-0 border-x-[14px] border-t-[26px] border-x-transparent drop-shadow-[0_3px_4px_rgba(0,0,0,.5)]"
        style={{ borderTopColor: "var(--primary)" }}
        aria-hidden="true"
      />
    </div>
  );
}

export function WheelPanel() {
  const { mutate: gm } = useSWRConfig();
  const list = useSWR("wheel/list", wheelApi.list);
  const history = useSWR("wheel/history", () => wheelApi.history(1));
  const wheels = normalizeWheels(list.data);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const w = wheels.find((x) => x.id === activeId) ?? wheels[0];

  const [rotation, setRotation] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [result, setResult] = React.useState<{ label: string; amount: string } | null>(null);

  async function spin() {
    if (!w) return;
    setSpinning(true);
    try {
      const r = normalizeSpin(await wheelApi.spin(w.id));
      const n = w.prizes.length || 8;
      const step = 360 / n;
      let idx = typeof r.index === "number" ? r.index : w.prizes.findIndex((p) => p.label === r.label);
      if (idx < 0) idx = Math.floor(Math.random() * n);
      const target = 360 - (idx * step + step / 2);
      setRotation((cur) => cur - (cur % 360) + 360 * 6 + target);
      setTimeout(() => {
        setSpinning(false);
        setResult({ label: r.label, amount: r.amount });
        list.mutate();
        history.mutate();
        gm("bonus/wallet");
      }, 4300);
    } catch (e) {
      setSpinning(false);
      toast.error(errorMessage(e));
    }
  }

  const spins = asList(history.data).map((h) => ({
    label: pickStr(h, ["reward_name", "reward.name", "name", "label"], "รางวัล"),
    amount: pickStr(h, ["amount", "reward.amount", "value"]),
    at: pickStr(h, ["created_at", "date"]),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="bg-felt border-gold-2">
        <CardContent className="flex flex-col items-center gap-5 py-7">
          {list.isLoading ? (
            <Skeleton className="aspect-square w-full max-w-[300px] rounded-full" />
          ) : !w ? (
            <p className="py-10 text-ivory-muted">ยังไม่มีวงล้อให้หมุนในขณะนี้</p>
          ) : (
            <>
              {wheels.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {wheels.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setActiveId(x.id)}
                      className={cn("h-10 rounded-full border px-4 text-sm font-semibold", x.id === w.id ? "bg-foil border-transparent text-primary-foreground" : "border-gold-2 text-gold-1")}
                    >
                      {x.name}
                    </button>
                  ))}
                </div>
              )}
              <WheelDisc w={w} rotation={rotation} spinning={spinning} />
              <div className="text-center">
                <div className="font-deco text-xs font-bold tracking-[0.3em] text-gold-2">LUCKY WHEEL</div>
                <div className="font-display text-xl font-semibold text-ivory">{w.name}</div>
                {w.spinsLeft !== undefined && (
                  <div className="text-sm text-ivory-muted">
                    สิทธิ์หมุนคงเหลือ <b className="text-gold-1">{w.spinsLeft} ครั้ง</b>
                  </div>
                )}
                {w.description && <p className="mt-1 text-sm text-ivory-muted">{w.description}</p>}
              </div>
              <Button size="lg" className="w-full max-w-xs" onClick={spin} disabled={spinning || w.spinsLeft === 0}>
                {spinning && <Loader2 className="animate-spin" />} {spinning ? "กำลังหมุน…" : "หมุนวงล้อ"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-5">
        <BonusWalletCard />
        <section className="flex flex-col gap-2.5">
          <h2 className="text-lg font-semibold">ประวัติการหมุน</h2>
          {history.isLoading ? (
            <Skeleton className="h-32" />
          ) : spins.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีประวัติ</p>
          ) : (
            spins.slice(0, 10).map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3">
                <div>
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{thaiDateTime(s.at)}</div>
                </div>
                <span className="font-display font-semibold text-brand">{s.amount ? `+${s.amount}` : "—"}</span>
              </div>
            ))
          )}
        </section>
      </div>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="text-center">
          <DialogHeader className="items-center pr-0">
            <span className="bg-soft mx-auto flex size-16 items-center justify-center rounded-full text-brand">
              <PartyPopper className="size-8" />
            </span>
            <DialogTitle className="text-2xl">ยินดีด้วย!</DialogTitle>
            <DialogDescription>รางวัลเงินจะเข้ากระเป๋าโบนัสวงล้อ กดโยกเข้าเกมเมื่อต้องการใช้</DialogDescription>
          </DialogHeader>
          <div className="font-display text-4xl font-bold text-brand">{result?.amount || result?.label}</div>
          <Button size="lg" onClick={() => setResult(null)}>
            ตกลง
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

