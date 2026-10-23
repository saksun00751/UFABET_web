"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { Skeleton } from "@/components/ui/skeleton";

/** หน้าที่ต้อง Login — ถ้ายังไม่ Login ส่งไป /login?next=... */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, authenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  React.useEffect(() => {
    if (!loading && !authenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, authenticated, router, pathname]);
  if (loading || !authenticated)
    return (
      <div className="flex flex-col gap-4 py-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  return <>{children}</>;
}
