"use client";
import Link from "next/link";
import { Loader2, Play } from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { useGameLaunch } from "@/hooks/use-member";
import { Button } from "@/components/ui/button";

/**
 * โหมด UFA Single Game: มีเส้นเข้าเกมเดียว (/game/login) → เปิดล็อบบี้ UFA ที่รวมทุกหมวด
 * จึงมีปุ่มเดียว เปิดในแท็บใหม่ (target blank) — ยังไม่ล็อกอินให้ไปหน้า login ก่อน
 */
export function GameZones() {
  const { authenticated } = useAuth();
  const { launch, launching } = useGameLaunch();
  return (
    <div className="flex justify-center">
      {authenticated ? (
        <Button type="button" size="lg" className="w-full max-w-sm" onClick={() => launch({ newTab: true })} disabled={launching}>
          {launching ? <Loader2 className="animate-spin" /> : <Play />} ทางเข้าเล่นเกม
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full max-w-sm">
          <Link href="/login?next=/">
            <Play /> ทางเข้าเล่นเกม
          </Link>
        </Button>
      )}
    </div>
  );
}
