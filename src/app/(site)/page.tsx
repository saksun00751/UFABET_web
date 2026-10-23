"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { useGameLaunch } from "@/hooks/use-member";
import { promotion } from "@/lib/api/member";
import { normalizePromotions } from "@/lib/api/normalize";
import { BalanceCard } from "@/components/member/balance-card";
import { BonusWalletCard } from "@/components/member/bonus-wallet-card";
import { GameZones } from "@/components/member/game-zones";
import { PromoCard } from "@/components/member/promo-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bulbs, Chip, SectionTitle } from "@/components/casino/ornament";

export default function HomePage() {
  const router = useRouter();
  const { authenticated, loading } = useAuth();
  // ปกติ proxy.ts ส่งไป /login ให้แล้ว นี่คือสำรองกรณี session หมดอายุฝั่ง backend
  React.useEffect(() => {
    if (!loading && !authenticated) router.replace("/login");
  }, [loading, authenticated, router]);
  if (loading) return <HomeSkeleton />;
  return authenticated ? <MemberHome /> : null;
}

function HomeSkeleton() {
  return (
    <div className="grid gap-5 py-5 lg:grid-cols-3">
      <Skeleton className="h-80 rounded-[1.75rem] lg:col-span-2" />
      <Skeleton className="h-80 rounded-[1.75rem]" />
    </div>
  );
}

function MemberHome() {
  const { launch, launching } = useGameLaunch();
  const promos = useSWR("promotion/list", promotion.list);
  const list = normalizePromotions(promos.data).items.slice(0, 3);

  return (
    <div className="flex flex-col gap-10 py-5 lg:gap-14 lg:py-8">
      <section className="grid gap-5 lg:grid-cols-3">
        <BalanceCard className="lg:col-span-1" />
        <div className="flex flex-col gap-5 lg:col-span-2">
          <button
            type="button"
            onClick={() => launch()}
            disabled={launching}
            className="foil-frame group block rounded-[1.75rem] text-left transition-transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            <span className="bg-felt relative flex flex-col overflow-hidden rounded-[calc(1.75rem-3px)]">
              <Bulbs />
              <span className="flex items-center gap-4 p-5 sm:p-7">
                <Chip className="size-16 shrink-0 text-sm sm:size-20" gap="var(--felt)">
                  {launching ? <Loader2 className="size-7 animate-spin" /> : "PLAY"}
                </Chip>
                <span className="flex-1">
                  <span className="text-foil block font-deco text-[clamp(1.4rem,5.5vw,2.25rem)] font-black whitespace-nowrap">PLAY NOW</span>
                  <span className="block font-display text-base text-ivory sm:text-lg">เข้าล็อบบี้เกม · กีฬา · คาสิโนสด · สล็อต · ยิงปลา</span>
                </span>
                <ArrowRight className="size-7 text-gold-2 transition-transform group-hover:translate-x-1" />
              </span>
              <Bulbs />
            </span>
          </button>
          <BonusWalletCard compact />
        </div>
      </section>

      <section className="grid grid-cols-4 gap-3 sm:gap-5">
        {[
          { href: "/rewards", label: "วงล้อ", mono: "W" },
          { href: "/rewards?tab=coupon", label: "คูปอง", mono: "CP" },
          { href: "/promotions", label: "โปรโมชั่น", mono: "%" },
          { href: "/referral", label: "แนะนำเพื่อน", mono: "FR" },
        ].map(({ href, label, mono }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card px-1 py-4 text-center transition-colors hover:border-gold-2">
            <Chip className="size-14 text-sm" gap="var(--card)">
              {mono}
            </Chip>
            <span className="font-display text-sm font-semibold sm:text-base">{label}</span>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <SectionTitle en="GAME ROOMS" th="ห้องเกม" />
        <GameZones />
      </section>

      {list.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionTitle en="VIP PRIVILEGES" th="โปรโมชั่น & โบนัส" />
          <div className="grid gap-5 md:grid-cols-3">
            {list.map((p, i) => (
              <PromoCard key={p.id || i} promo={p} index={i} />
            ))}
          </div>
          <div className="text-center">
            <Button asChild variant="outline">
              <Link href="/promotions">ดูโปรโมชั่นทั้งหมด</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
