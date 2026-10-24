"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { MenuIcon, XIcon } from "lucide-react";
import { Logo } from "./logo";
import { ThemeDialog } from "./theme-switcher";
import { BalancePill } from "./balance-pill";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** เรียงตามความสำคัญ: ธุรกรรมหลัก → โปรโมชั่น/กิจกรรม → ประวัติ → ช่วยเหลือ → บัญชี */
const NAV = [
  { href: "/", label: "หน้าแรก" },
  { href: "/deposit", label: "ฝากเงิน", auth: true },
  { href: "/withdraw", label: "ถอนเงิน", auth: true },
  { href: "/promotions", label: "โปรโมชั่น" },
  { href: "/wheel", label: "วงล้อ", auth: true },
  { href: "/coupons", label: "คูปอง", auth: true },
  { href: "/rewards", label: "ของรางวัล", auth: true },
  { href: "/referral", label: "แนะนำเพื่อน", auth: true },
  { href: "/history", label: "ประวัติ", auth: true },
  { href: "/contact", label: "ติดต่อ" },
  { href: "/profile", label: "บัญชี", auth: true },
  { href: "/login", label: "เข้าสู่ระบบ", guest: true },
];

const linkCls = (active: boolean) =>
  cn(
    "rounded-full border px-3.5 py-1.5 font-display text-[15px] font-semibold whitespace-nowrap transition-colors",
    active ? "border-gold-2 bg-soft text-brand" : "border-transparent text-foreground/85 hover:text-brand",
  );

/**
 * Header ชุดเดียว: จอกว้าง (≥1200px) วางเมนูในแถวเดียวกับโลโก้
 * จอแคบแสดงปุ่มแฮมเบอร์เกอร์ เปิดเมนูเป็น sidebar เลื่อนจากซ้าย
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { authenticated, loading } = useAuth();
  const [open, setOpen] = React.useState(false);
  const items = NAV.filter((n) => (n.auth ? authenticated : n.guest ? !authenticated && !loading : true));
  return (
    <header className="sticky top-0 z-40">
      <div className="overflow-hidden border-b border-gold-3 bg-felt whitespace-nowrap">
        <div className="flex w-max animate-marquee py-1.5 lg:w-full lg:animate-none lg:justify-center font-deco text-[clamp(9px,2.4vw,11px)] font-bold tracking-[0.22em] text-gold-2">
          {[0, 1].map((n) => (
            <div key={n} className={cn("flex shrink-0", n === 1 && "lg:hidden")} aria-hidden={n === 1 || undefined}>
              {/* ซ้ำหลายรอบให้วิ่งต่อเนื่องไม่มีช่องว่าง — จอ lg ขึ้นไปแสดงชุดเดียวอยู่กลาง ไม่เลื่อน */}
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className={cn("flex shrink-0 gap-7 pr-7 lg:pr-0", k > 0 && "lg:hidden")}>
                  <span>◆ ฝาก-ถอนอัตโนมัติ 24 ชม.</span>
                  <span>◆ ROYAL WELCOME BONUS</span>
                  <span>◆ 18+ PLAY RESPONSIBLY</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl 2xl:max-w-[1600px] items-center gap-x-[clamp(0.5rem,2vw,1.5rem)] gap-y-2 px-[clamp(1rem,3vw,1.5rem)] py-[clamp(0.5rem,1.5vw,0.75rem)]">
          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger
              aria-label="เปิดเมนู"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground hover:text-brand [@media(min-width:1200px)]:hidden"
            >
              <MenuIcon className="size-6" />
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <DialogPrimitive.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto border-r border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <DialogPrimitive.Title className="sr-only">เมนูหลัก</DialogPrimitive.Title>
                  <Logo />
                  <DialogPrimitive.Close className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                    <XIcon className="size-5" />
                    <span className="sr-only">ปิด</span>
                  </DialogPrimitive.Close>
                </div>
                <nav aria-label="เมนูหลัก" className="flex flex-col gap-1">
                  {items.map((n) => {
                    const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
                    return (
                      <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn(linkCls(active), "py-3")}>
                        {n.label}
                      </Link>
                    );
                  })}
                </nav>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
          <Logo hideTextOnMobile />
          <nav aria-label="เมนูหลัก" className="hidden min-w-0 flex-1 gap-1 [@media(min-width:1200px)]:flex">
            {items.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn(linkCls(active), "shrink-0")}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeDialog />
            {loading ? null : authenticated ? (
              <BalancePill />
            ) : site.registration ? (
              <Button asChild size="sm">
                <Link href="/register">สมัครสมาชิก</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
