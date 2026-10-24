"use client";
import Link from "next/link";
import { useBrand } from "@/components/providers/brand";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md", hideTextOnMobile = false, stacked = false }: { className?: string; size?: "sm" | "md" | "lg" | "xl"; hideTextOnMobile?: boolean; stacked?: boolean }) {
  const brand = useBrand();
  const name = brand.name || site.name;
  const box = size === "xl" ? "size-[clamp(9rem,34vw,14rem)]" : size === "lg" ? "size-18" : size === "sm" ? "size-10" : "size-[clamp(2.5rem,7vw,3rem)]";
  const text = size === "xl" ? "text-[clamp(2.25rem,9vw,3.5rem)]" : size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-[clamp(1.2rem,4.5vw,1.5rem)]";
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-3", stacked && "flex-col gap-5 text-center", className)} aria-label={`${name} หน้าแรก`}>
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt={name} className={cn("shrink-0 rounded-full object-contain", size === "xl" && "drop-shadow-[0_0_28px_color-mix(in_oklab,var(--g2)_55%,transparent)]", box)} />
      ) : null}
      <span className={cn("flex-col leading-none", stacked && "items-center", hideTextOnMobile && brand.logo ? "hidden sm:flex" : "flex")}>
        <span className={cn("text-foil font-deco font-black tracking-[0.12em] whitespace-nowrap", text)}>{name}</span>
      </span>
    </Link>
  );
}
