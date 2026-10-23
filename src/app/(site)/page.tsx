"use client";
import Link from "next/link";
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
import { CrownIcon } from "@/components/casino/icons";

export default function HomePage() {
  const { authenticated, loading } = useAuth();
  if (loading) return <HomeSkeleton />;
  return authenticated ? <MemberHome /> : <GuestHome />;
}

function HomeSkeleton() {
  return (
    <div className="grid gap-5 py-5 lg:grid-cols-3">
      <Skeleton className="h-80 rounded-[1.75rem] lg:col-span-2" />
      <Skeleton className="h-80 rounded-[1.75rem]" />
    </div>
  );
}

function GuestHome() {
  return (
    <div className="flex flex-col gap-12 py-5 lg:gap-16 lg:py-8">
      <section className="foil-frame rounded-[2.25rem] shadow-2xl">
        <div className="bg-felt relative overflow-hidden rounded-[calc(2.25rem-3px)]">
          <Bulbs />
          <div className="grid items-center gap-8 p-7 sm:p-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="font-deco text-sm font-bold tracking-[0.4em] text-gold-2">WELCOME TO THE</div>
              <h1 className="text-foil mt-1 font-deco text-5xl leading-[1.05] font-black sm:text-6xl lg:text-7xl">ROYAL CASINO</h1>
              <p className="mt-5 max-w-xl font-display text-2xl leading-snug text-ivory sm:text-3xl">ความหรูหราระดับราชวงศ์ ทุกเกมในที่เดียว</p>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-ivory-muted">กีฬา คาสิโนสด สล็อต ยิงปลา และเกมไพ่ ครบในบัญชีเดียว สมัครง่ายด้วยเบอร์โทรและบัญชีธนาคาร</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    สมัครสมาชิก <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="felt">
                  <Link href="/login">เข้าสู่ระบบ</Link>
                </Button>
              </div>
            </div>
            <aside className="arch bg-foil mx-auto w-full max-w-xs p-[3px]">
              <div className="arch flex flex-col items-center gap-3 bg-felt px-6 pt-12 pb-8 text-center">
                <CrownIcon className="size-12 text-gold-2" />
                <div className="font-deco text-xs font-bold tracking-[0.35em] text-gold-2">ROYAL JACKPOT</div>
                <div className="text-foil font-deco text-4xl font-black">VIP</div>
                <div className="font-display text-ivory">สิทธิพิเศษสำหรับสมาชิก</div>
                <div className="mt-2 flex gap-2">
                  {["A♠", "K♦", "Q♣"].map((c) => (
                    <Chip key={c} className="size-12 text-sm" gap="var(--felt)">
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </aside>
          </div>
          <Bulbs />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionTitle en="GAME ROOMS" th="ห้องเกม" />
        <GameZones />
      </section>

      <Features />
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

function Features() {
  const items = [
    { mono: "24", t: "ฝาก-ถอน อัตโนมัติ", d: "ทำรายการเองได้ตลอด 24 ชั่วโมง" },
    { mono: "SSL", t: "ปลอดภัย เป็นส่วนตัว", d: "เข้ารหัสข้อมูลทุกการเชื่อมต่อ" },
    { mono: "VIP", t: "ดูแลระดับ VIP", d: "ติดต่อทีมงานได้ทุกเวลา" },
  ];
  return (
    <section className="flex flex-col gap-6">
      <SectionTitle en="THE ROYAL SERVICE" th="บริการระดับพรีเมียม" />
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ mono, t, d }) => (
          <div key={t} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6">
            <Chip className="size-14 shrink-0 text-xs" gap="var(--card)">
              {mono}
            </Chip>
            <div>
              <div className="font-display text-lg font-semibold">{t}</div>
              <div className="text-sm leading-relaxed text-muted-foreground">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
