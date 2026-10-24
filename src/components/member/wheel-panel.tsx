"use client";
import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { wheel as wheelApi } from "@/lib/api/member";
import { normalizeSpin, normalizeWheels, type Wheel } from "@/lib/api/normalize";
import { asList, pickStr } from "@/lib/api/shape";
import { errorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import { thaiDateTime, toNumber } from "@/lib/format";
import { useProfile } from "@/hooks/use-member";
import { pick } from "@/lib/api/shape";
import { DiamondIcon } from "@/components/casino/icons";
import { BonusWalletCard } from "./bonus-wallet-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SEG = ["#1A1206", "#C9A24B"];

/** โหลดสคริปต์ครั้งเดียว (TweenMax → Winwheel) แบบเดียวกับ lotto-seed-app */
function loadScript(src: string, flag: string) {
  return new Promise<void>((resolve) => {
    const ex = document.querySelector<HTMLScriptElement>(`script[data-${flag}]`);
    if (ex) {
      if (ex.dataset.loaded) resolve();
      else ex.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.setAttribute(`data-${flag}`, "true");
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    document.body.appendChild(s);
  });
}

type WheelHandle = {
  rotationAngle: number;
  animation: { duration?: number; stopAngle?: number; callbackFinished?: () => void };
  draw(): void;
  startAnimation(): void;
  stopAnimation(canCallback?: boolean): void;
};

function WheelDisc({ w, wheelRef }: { w: Wheel; wheelRef: React.RefObject<WheelHandle | null> }) {
  // w ถูกสร้างใหม่ทุก render — ผูก effect กับเนื้อหาช่องรางวัลแทน ไม่งั้นวงล้อถูกรีเซ็ตทุกครั้งที่ state เปลี่ยน (เช่น ตอนกดหมุน)
  const sig = JSON.stringify(w.prizes);
  React.useEffect(() => {
    let cancelled = false;
    const prizes = JSON.parse(sig) as Wheel["prizes"];
    if (!prizes.length) return;
    (async () => {
      const loaded = await Promise.all(
        prizes.map((p) => new Promise<boolean>((r) => {
          if (!p.image) return r(false);
          const img = new Image();
          img.onload = () => r(true);
          img.onerror = () => r(false);
          img.src = p.image;
        })),
      );
      const hasImg = loaded.every(Boolean);
      if (!(window as unknown as { TweenMax?: unknown }).TweenMax) await loadScript("/TweenMax.min.js", "tweenmax-script");
      if (!window.Winwheel) await loadScript("/Winwheel.min.js", "winwheel-script");
      if (cancelled || !window.Winwheel) return;
      wheelRef.current = new window.Winwheel({
        canvasId: "spin-canvas",
        numSegments: prizes.length,
        // ช่องไหนไม่มีรูป (หรือโหลดไม่ได้) ให้วาดเป็นสี + ข้อความแทน
        drawMode: hasImg ? "segmentImage" : "code",
        drawText: !hasImg,
        textFontSize: 16,
        textFillStyle: "#fff",
        imageDirection: "N",
        outerRadius: 170,
        innerRadius: 0,
        strokeStyle: "white",
        lineWidth: 2,
        segments: prizes.map((p, i) => ({ fillStyle: p.color || SEG[i % SEG.length], image: p.image, text: p.label })),
        animation: { type: "spinToStop", duration: 5, spins: 8 },
      }) as unknown as WheelHandle;
      setTimeout(() => !cancelled && wheelRef.current?.draw(), 100);
    })();
    return () => {
      cancelled = true;
      wheelRef.current?.stopAnimation(false);
      wheelRef.current = null;
    };
  }, [sig, wheelRef]);

  return (
    <div className="rng-canvas-container">
      <img src="/wheel_back.png" alt="" className="rng-canvas-bg" />
      <div className="rng-canvas-stage">
        <div className="rng-canvas-pointer" aria-hidden="true">
          <svg width="22" height="30" viewBox="0 0 22 30">
            <circle cx="11" cy="6" r="4" fill="var(--primary)" stroke="var(--primary)" strokeWidth="2" />
          </svg>
        </div>
        <canvas id="spin-canvas" className="rng-canvas-canvas" width="400" height="400" />
      </div>
    </div>
  );
}

export function WheelPanel() {
  const { mutate: gm } = useSWRConfig();
  const list = useSWR("wheel/list", wheelApi.list);
  const history = useSWR("wheel/history", wheelApi.history);
  const profile = useProfile();
  const rawDiamond = pick(profile.data, ["profile.rewards.diamonds", "rewards.diamonds", "diamond"]);
  const diamond = rawDiamond === undefined ? undefined : toNumber(rawDiamond);
  const wheels = normalizeWheels(list.data);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const w = wheels.find((x) => x.id === activeId) ?? wheels[0];

  const wheelRef = React.useRef<WheelHandle | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spinning, setSpinning] = React.useState(false);
  const [result, setResult] = React.useState<{ label: string; amount: string } | null>(null);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function spin() {
    const wh = wheelRef.current;
    if (!w || spinning) return;
    if (!wh) {
      toast.error("วงล้อยังโหลดไม่เสร็จ ลองใหม่อีกครั้ง");
      console.warn("[wheel] Winwheel ยังไม่ถูกสร้าง", { Winwheel: !!window.Winwheel, prizes: w.prizes });
      return;
    }
    setSpinning(true);
    wh.stopAnimation(false);
    wh.rotationAngle = 0;
    wh.animation.stopAngle = undefined;
    wh.animation.callbackFinished = undefined;
    wh.draw();
    try {
      const raw = await wheelApi.spin();
      console.log("[wheel] spin response", raw);
      const r = normalizeSpin(raw);
      const n = w.prizes.length;
      const step = 360 / n;
      let stop = r.point;
      if (stop === undefined) {
        const idx = r.code ? w.prizes.findIndex((p) => p.code === r.code) : -1;
        if (idx < 0) throw new Error("ไม่สามารถระบุตำแหน่งวงล้อได้");
        stop = idx * step + step * (0.2 + Math.random() * 0.6);
      }
      wh.animation.stopAngle = stop;
      let shown = false;
      const done = () => {
        if (shown) return;
        shown = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        setSpinning(false);
        setResult({ label: r.label, amount: r.amount });
        list.mutate();
        history.mutate();
        gm("bonus/wallet");
        profile.mutate();
      };
      wh.animation.callbackFinished = done;
      wh.startAnimation();
      // fallback กรณี callback ของ Winwheel ไม่ถูกเรียก
      timerRef.current = setTimeout(() => { wh.stopAnimation(false); done(); }, (wh.animation.duration ?? 5) * 1000 + 800);
    } catch (e) {
      setSpinning(false);
      console.warn("[wheel] spin failed", e);
      // 422 ของวงล้อมักเป็นเหตุผลจาก backend (เช่น ไม่มีสิทธิ์หมุน) — แสดงข้อความจริงแทนข้อความทั่วไป
      toast.error(e instanceof ApiError && e.status === 422 && e.message ? e.message : errorMessage(e));
    }
  }

  const spins = asList(history.data).map((h) => ({
    label: pickStr(h, ["bonus_name", "reward_name", "name", "label"], "รางวัล"),
    amount: pickStr(h, ["amount", "reward.amount", "value"]),
    at: pickStr(h, ["date_create", "created_at", "date"]),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="bg-felt border-gold-2">
        <CardContent className="flex flex-col items-center gap-5 py-7">
          {list.isLoading ? (
            <Skeleton className="aspect-square w-full max-w-[360px] rounded-full" />
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
              <WheelDisc w={w} wheelRef={wheelRef} />
              <div className="text-center">
                <div className="font-deco text-xs font-bold tracking-[0.3em] text-gold-2">LUCKY WHEEL</div>
                <div className="font-display text-xl font-semibold text-ivory">{w.name}</div>
                {diamond !== undefined && (
                  <div className="bg-soft mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-2 px-3.5 py-1.5">
                    <DiamondIcon className="size-4 text-gold-2" />
                    <b className="font-display text-base tabular-nums text-gold-1">{diamond.toLocaleString("th-TH")}</b>
                    <span className="text-xs text-ivory-muted">Diamond</span>
                  </div>
                )}
                {w.spinsLeft !== undefined && (
                  <div className="text-sm text-ivory-muted">
                    สิทธิ์หมุนคงเหลือ <b className="text-gold-1">{w.spinsLeft} ครั้ง</b>
                  </div>
                )}
                {w.description && <p className="mt-1 text-sm text-ivory-muted">{w.description}</p>}
              </div>
              <Button size="lg" className="w-full max-w-xs" onClick={spin} disabled={spinning || w.spinsLeft === 0 || (diamond !== undefined && diamond < 1)}>
                {spinning && <Loader2 className="animate-spin" />} {spinning ? "กำลังหมุน…" : diamond !== undefined && diamond < 1 ? "ไม่มี Diamond สำหรับหมุน" : "หมุนวงล้อ"}
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

