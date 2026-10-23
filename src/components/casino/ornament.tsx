import { cn } from "@/lib/utils";

/** หัวข้อสไตล์ Art Deco: ◆ —— TITLE —— ◆ */
export function SectionTitle({ en, th, className }: { en: string; th?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1 text-center", className)}>
      <div className="ornament w-full justify-center" aria-hidden="true">
        <span className="font-deco">◆</span>
      </div>
      <h2 className="font-deco text-3xl font-black tracking-[0.14em] text-brand sm:text-4xl lg:text-5xl">{en}</h2>
      {th && <p className="font-display text-base text-muted-foreground sm:text-lg">{th}</p>}
    </div>
  );
}

export function Bulbs({ className }: { className?: string }) {
  return <div className={cn("bulbs w-full", className)} aria-hidden="true" />;
}

/** ชิปโป๊กเกอร์ทอง */
export function Chip({ children, className, gap = "var(--felt)" }: { children: React.ReactNode; className?: string; gap?: string }) {
  return (
    <span
      className={cn("bg-foil chip flex shrink-0 items-center justify-center font-deco font-black text-primary-foreground", className)}
      style={{ ["--chip-gap" as string]: gap }}
    >
      {children}
    </span>
  );
}
