import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CrownIcon } from "@/components/casino/icons";

export function Logo({ className, size = "md", tagline = true }: { className?: string; size?: "sm" | "md" | "lg"; tagline?: boolean }) {
  const box = size === "lg" ? "size-18" : size === "sm" ? "size-10" : "size-[clamp(2.5rem,7vw,3rem)]";
  const icon = size === "lg" ? "size-9" : size === "sm" ? "size-5" : "size-6";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-[clamp(1.2rem,4.5vw,1.5rem)]";
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-3", className)} aria-label={`${site.name} หน้าแรก`}>
      <span
        className={cn("bg-foil glow flex items-center justify-center rounded-full text-primary-foreground", box)}
        style={{ boxShadow: "0 0 0 2px var(--card), 0 0 0 3px var(--g2)" }}
      >
        <CrownIcon className={icon} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("text-foil font-deco font-black tracking-[0.12em] whitespace-nowrap", text)}>{site.name}</span>
        {tagline && <span className="mt-1 font-deco text-[10px] tracking-[clamp(0.2em,1vw,0.42em)] text-muted-foreground">ROYAL CASINO</span>}
      </span>
    </Link>
  );
}
