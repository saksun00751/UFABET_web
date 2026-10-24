"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Gamepad2, Headset, House, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { useGameLaunch } from "@/hooks/use-member";
import { cn } from "@/lib/utils";

const itemCls = (active: boolean) =>
  cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors", active ? "text-brand" : "text-muted-foreground hover:text-foreground");

/** เมนูล่างสำหรับมือถือ (เฉพาะสมาชิก) — ปุ่มเข้าเกมอยู่กลางและเด่นที่สุด */
export function BottomNav() {
  const pathname = usePathname();
  const { authenticated } = useAuth();
  const { launch, launching } = useGameLaunch();
  if (!authenticated) return null;

  return (
    <nav aria-label="เมนูด่วน" className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-3 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-end px-2">
        <Link href="/" className={itemCls(pathname === "/")}>
          <House className="size-6" />
          หน้าแรก
        </Link>
        <Link href="/deposit" className={itemCls(pathname.startsWith("/deposit"))}>
          <ArrowDownToLine className="size-6" />
          ฝาก
        </Link>
        <div className="flex flex-1 flex-col items-center">
          <button
            type="button"
            onClick={() => launch()}
            disabled={launching}
            aria-label="เข้าเกม"
            className="bg-foil glow -mt-6 flex size-16 items-center justify-center rounded-full border-4 border-card text-primary-foreground shadow-xl transition-transform active:scale-95 disabled:opacity-70"
          >
            {launching ? <Loader2 className="size-8 animate-spin" /> : <Gamepad2 className="size-8" />}
          </button>
          <span className="py-1 text-[11px] font-bold text-brand">เข้าเกม</span>
        </div>
        <Link href="/withdraw" className={itemCls(pathname.startsWith("/withdraw"))}>
          <ArrowUpFromLine className="size-6" />
          ถอน
        </Link>
        <Link href="/contact" className={itemCls(pathname.startsWith("/contact"))}>
          <Headset className="size-6" />
          ติดต่อ
        </Link>
      </div>
    </nav>
  );
}
