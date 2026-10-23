import { Logo } from "@/components/layout/logo";
import { ThemeDialog } from "@/components/layout/theme-switcher";
import { Bulbs } from "@/components/casino/ornament";
import { CrownIcon } from "@/components/casino/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="foil-frame w-full max-w-6xl rounded-[2rem] shadow-2xl">
        <div className="flex flex-wrap overflow-hidden rounded-[calc(2rem-3px)] bg-card">
          <aside className="bg-felt flex flex-[1_1_420px] flex-col items-center justify-center gap-[clamp(1rem,3vw,1.5rem)] p-[clamp(1.25rem,4vw,2.5rem)] text-center">
            <div className="flex w-full items-center justify-between gap-3">
              <Logo tagline={false} />
              <ThemeDialog />
            </div>
            <div className="arch w-full max-w-[min(320px,80%)] border border-gold-2 p-2">
              <div className="arch flex flex-col items-center gap-[clamp(0.4rem,1.5vw,0.75rem)] border border-gold-2/40 px-5 pt-[clamp(1.75rem,5vw,3rem)] pb-[clamp(1.25rem,3vw,2rem)]">
                <Bulbs />
                <CrownIcon className="size-[clamp(2rem,6vw,2.75rem)] text-gold-2" />
                <div className="text-foil font-deco text-[clamp(1.6rem,5vw,2.25rem)] leading-tight font-black">
                  MEMBERS
                  <br />
                  CLUB
                </div>
                <div className="font-display text-[clamp(0.95rem,2.4vw,1.125rem)] font-semibold">ยินดีต้อนรับสู่คาสิโนระดับพรีเมียม</div>
                <Bulbs />
              </div>
            </div>
            <div className="font-deco text-xs tracking-[0.3em] text-gold-2">◆ 18+ · PLAY RESPONSIBLY ◆</div>
          </aside>
          <section className="flex-[1_1_460px] p-5 sm:p-10 lg:p-12">{children}</section>
        </div>
      </div>
    </div>
  );
}
