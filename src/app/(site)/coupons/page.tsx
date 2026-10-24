"use client";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { CouponPanel } from "@/components/member/coupon-panel";

export default function CouponsPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col gap-4">
        <PageHeader title="คูปอง" />
        <CouponPanel />
      </div>
    </AuthGuard>
  );
}
