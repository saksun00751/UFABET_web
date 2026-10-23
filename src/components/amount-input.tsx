"use client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const label = (c: number) => (c >= 1000 ? `${c / 1000}K` : String(c));

/** ช่องจำนวนเงิน + ชิปโป๊กเกอร์ */
export function AmountInput({
  id,
  value,
  onChange,
  chips = [100, 300, 500, 1000, 3000, 5000],
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  chips?: number[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="foil-frame rounded-3xl">
        <div className="flex h-20 items-center gap-2 rounded-[calc(1.5rem-3px)] bg-card px-5">
          <span className="font-deco text-3xl font-black text-brand">฿</span>
          <Input
            id={id}
            inputMode="decimal"
            value={value}
            placeholder="0"
            onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
            className="h-full border-0 bg-transparent px-0 font-deco text-4xl font-black focus-visible:ring-0"
          />
        </div>
      </div>
      {chips.length > 0 && (
        <div className="grid grid-cols-3 justify-items-center gap-3 sm:grid-cols-6">
          {chips.map((c) => {
            const on = Number(value) === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange(String(c))}
                aria-label={`฿${c.toLocaleString("th-TH")}`}
                aria-pressed={on}
                className={cn(
                  "chip flex size-16 items-center justify-center font-deco text-base font-black transition-transform hover:-translate-y-0.5",
                  on ? "bg-foil text-primary-foreground glow" : "bg-felt text-gold-2",
                )}
                style={{ ["--chip-gap" as string]: on ? "var(--felt)" : "var(--g3)" }}
              >
                {label(c)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
