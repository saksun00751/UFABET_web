import { bankColor } from "@/lib/banks";
import { cn } from "@/lib/utils";

export function BankChip({ shortcode, className }: { shortcode?: string; className?: string }) {
  return (
    <span
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl text-[10px] font-bold tracking-wide text-white", className)}
      style={{ background: bankColor(shortcode) }}
      aria-hidden="true"
    >
      {(shortcode || "BANK").slice(0, 5)}
    </span>
  );
}
