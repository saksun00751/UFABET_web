"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, History, LogOut, Sparkles, UsersRound, Wallet, Headset } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth";
import { useProfile } from "@/hooks/use-member";
import { pickStr } from "@/lib/api/shape";
import { maskPhone } from "@/lib/format";
import { site } from "@/lib/site";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { ThemePresetGrid } from "@/components/layout/theme-switcher";
import { BankChip } from "@/components/bank-chip";
import { BalanceCard } from "@/components/member/balance-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <Profile />
    </AuthGuard>
  );
}

function Profile() {
  const router = useRouter();
  const { member, logout } = useAuth();
  const { data, isLoading } = useProfile();
  const { resolvedTheme, setTheme } = useTheme();

  const name = [pickStr(data, ["firstname", "first_name"]), pickStr(data, ["lastname", "last_name"])].filter(Boolean).join(" ");
  const bankShort = pickStr(data, ["bank_shortcode", "bank.shortcode", "bank_name"]);
  const accNo = pickStr(data, ["acc_no_masked", "acc_no", "account_no"]);
  const level = pickStr(data, ["level", "vip_level", "rank", "member_level"]);

  const links = [
    { href: "/history", label: "ประวัติฝาก-ถอน", icon: History },
    { href: "/rewards", label: "วงล้อ คูปอง ของรางวัล", icon: Sparkles },
    { href: "/referral", label: "แนะนำเพื่อน", icon: UsersRound },
    { href: "/withdraw", label: "ถอนเงิน", icon: Wallet },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="บัญชีของฉัน" back={false} />
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="bg-felt border-gold-2">
          <CardContent className="flex flex-col gap-4">
            <div className="font-deco text-[11px] font-bold tracking-[0.3em] text-gold-2">ROYAL MEMBER CARD</div>
            <div className="flex items-center gap-4">
              <span className="bg-foil chip flex size-16 items-center justify-center font-deco text-2xl font-black text-primary-foreground" style={{ ["--chip-gap" as string]: "var(--felt)" }}>
                {(name || member?.user_name || "M").slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-xl font-semibold text-ivory">{isLoading ? "…" : name || maskPhone(member?.user_name)}</div>
                <div className="font-deco text-sm tracking-wider text-ivory-muted">{maskPhone(member?.user_name)} · Nº {member?.code}</div>
              </div>
              {level && <span className="bg-foil rounded-full px-3 py-1 font-deco text-xs font-black tracking-wide text-primary-foreground">{level}</span>}
            </div>
            {isLoading ? (
              <Skeleton className="h-16" />
            ) : (
              accNo && (
                <div className="flex items-center gap-3 rounded-2xl border border-gold-2/40 p-3.5">
                  <BankChip shortcode={bankShort} />
                  <div>
                    <div className="text-xs text-ivory-muted">บัญชีสำหรับถอน</div>
                    <div className="font-deco font-bold tracking-wider text-gold-1">{accNo}</div>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
        <BalanceCard />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">ธีมและการแสดงผล</h2>
            <div className="flex gap-1 rounded-full bg-secondary p-1">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTheme(m)}
                  className={cn("h-9 rounded-full px-4 text-sm font-semibold", resolvedTheme === m ? "bg-gold-grad text-primary-foreground" : "text-muted-foreground")}
                >
                  {m === "light" ? "สว่าง" : "มืด"}
                </button>
              ))}
            </div>
          </div>
          <ThemePresetGrid />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center gap-3 px-5 hover:bg-secondary">
                <Icon className="size-5 text-brand" />
                <span className="flex-1 font-medium">{label}</span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {site.supportUrl && (
            <li>
              <a href={site.supportUrl} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 px-5 hover:bg-secondary">
                <Headset className="size-5 text-brand" />
                <span className="flex-1 font-medium">ติดต่อเจ้าหน้าที่</span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </a>
            </li>
          )}
        </ul>
      </Card>

      <Button
        variant="ghost"
        className="text-destructive"
        onClick={async () => {
          await logout();
          toast.success("ออกจากระบบแล้ว");
          router.replace("/login");
        }}
      >
        <LogOut /> ออกจากระบบ
      </Button>
    </div>
  );
}
