"use client";
import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import type { Promo } from "@/lib/api/normalize";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FACES = [
  ["A", "♠"],
  ["K", "♦"],
  ["Q", "♣"],
  ["J", "♠"],
];
const KICKERS = ["WELCOME", "DAILY", "WEEKLY", "VIP", "SPECIAL"];

/** โปรโมชั่นแบบไพ่: ตัวเลขมุมบน-ล่างกลับหัว */
export function PromoCard({
  promo,
  index = 0,
  onSelect,
  onDeselect,
  busy,
}: {
  promo: Promo;
  index?: number;
  onSelect?: () => void;
  onDeselect?: () => void;
  busy?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [idx, suit] = FACES[index % FACES.length];
  const sel = promo.selected;
  const corner = cn("absolute font-deco text-lg leading-tight font-black text-center", sel ? "text-gold-2" : "text-brand");
  return (
    <article className="foil-frame rounded-3xl shadow-xl">
      <div
        className={cn(
          "relative flex h-full min-h-[360px] flex-col items-center justify-center gap-3 rounded-[calc(1.5rem-3px)] px-6 py-10 text-center",
          sel ? "bg-felt" : "bg-card",
        )}
      >
        <span className={cn(corner, "top-4 left-5")} aria-hidden="true">
          {idx}
          <br />
          {suit}
        </span>
        <span className={cn(corner, "right-5 bottom-4 rotate-180")} aria-hidden="true">
          {idx}
          <br />
          {suit}
        </span>
        {sel && (
          <span className="bg-foil absolute top-4 right-4 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
            <Check className="size-3.5" /> เลือกแล้ว
          </span>
        )}
        {promo.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.image} alt="" className="aspect-[16/9] w-full rounded-2xl border border-gold-2 object-cover" />
        ) : (
          <>
            <div className={cn("font-deco text-[11px] font-bold tracking-[0.35em]", sel ? "text-ivory-muted" : "text-muted-foreground")}>
              {KICKERS[index % KICKERS.length]}
            </div>
            <div className="text-foil font-deco text-6xl leading-none font-black sm:text-7xl">{promo.bonusText || "VIP"}</div>
          </>
        )}
        <h3 className={cn("text-xl font-bold sm:text-2xl", sel ? "text-ivory" : "text-foreground")}>{promo.title}</h3>
        {(promo.minDeposit || promo.turnover || promo.maxBonus) && (
          <p className={cn("text-sm", sel ? "text-ivory-muted" : "text-muted-foreground")}>
            {[promo.minDeposit && `ฝากขั้นต่ำ ${promo.minDeposit}`, promo.turnover && `เทิร์น ${promo.turnover}`, promo.maxBonus && `สูงสุด ${promo.maxBonus}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {promo.description && (
          <p className={cn("text-sm leading-relaxed whitespace-pre-line", sel ? "text-ivory-muted" : "text-muted-foreground", !expanded && "line-clamp-3")}>
            {promo.description}
          </p>
        )}
        {promo.description && promo.description.length > 120 && (
          <button type="button" className={cn("text-sm font-semibold", sel ? "text-gold-1" : "text-brand")} onClick={() => setExpanded((e) => !e)}>
            {expanded ? "ย่อ" : "อ่านเงื่อนไขทั้งหมด"}
          </button>
        )}
        {onSelect && (
          <div className="mt-2 w-full max-w-xs">
            {sel ? (
              <Button variant="felt" className="w-full" onClick={onDeselect} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} ยกเลิกโปรนี้
              </Button>
            ) : (
              <Button className="w-full" onClick={onSelect} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} เลือกโปรนี้
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
