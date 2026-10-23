import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-[clamp(1rem,3vw,1.5rem)] pb-6">{children}</main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
