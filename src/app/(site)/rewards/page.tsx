"use client";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { RewardPanel } from "@/components/member/reward-panel";

export default function RewardsPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col gap-4">
        <PageHeader title="ของรางวัล" />
        <RewardPanel />
      </div>
    </AuthGuard>
  );
}
