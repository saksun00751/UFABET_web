"use client";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { WheelPanel } from "@/components/member/wheel-panel";

export default function WheelPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col gap-4">
        <PageHeader title="วงล้อนำโชค" />
        <WheelPanel />
      </div>
    </AuthGuard>
  );
}
