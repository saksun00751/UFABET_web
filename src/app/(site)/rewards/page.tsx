"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { WheelPanel } from "@/components/member/wheel-panel";
import { CouponPanel } from "@/components/member/coupon-panel";
import { RewardPanel } from "@/components/member/reward-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RewardsPage() {
  return (
    <AuthGuard>
      <Suspense>
        <Rewards />
      </Suspense>
    </AuthGuard>
  );
}

function Rewards() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = ["wheel", "coupon", "reward"].includes(params.get("tab") ?? "") ? (params.get("tab") as string) : "wheel";
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="รางวัล & โบนัส" />
      <Tabs value={tab} onValueChange={(v) => router.replace(`/rewards?tab=${v}`, { scroll: false })}>
        <TabsList className="max-w-lg">
          <TabsTrigger value="wheel">วงล้อ</TabsTrigger>
          <TabsTrigger value="coupon">คูปอง</TabsTrigger>
          <TabsTrigger value="reward">ของรางวัล</TabsTrigger>
        </TabsList>
        <TabsContent value="wheel">
          <WheelPanel />
        </TabsContent>
        <TabsContent value="coupon">
          <CouponPanel />
        </TabsContent>
        <TabsContent value="reward">
          <RewardPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
