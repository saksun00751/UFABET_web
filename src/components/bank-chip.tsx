import { bankColor } from "@/lib/banks";
import { cn } from "@/lib/utils";

export function BankChip({ shortcode, className }: { shortcode?: string; className?: string }) {
  const code = (shortcode || "BANK").slice(0, 5);
  // ตัวอักษรยิ่งยาวยิ่งเล็ก เพื่อไม่ให้ล้นวงกลม
  const text = code.length >= 5 ? "text-[8px]" : code.length === 4 ? "text-[9px]" : "text-[10px]";
  return (
    <span
      className={cn("flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl px-0.5 leading-none font-bold tracking-tight text-white", text, className)}
      style={{ background: bankColor(shortcode) }}
      aria-hidden="true"
    >
      {code}
    </span>
  );
}
