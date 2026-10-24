import { Logo } from "@/components/layout/logo";
import { ThemeDialog } from "@/components/layout/theme-switcher";
import { ContactChannels } from "@/components/layout/contact-channels";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-3 py-6 max-md:pb-32 sm:px-4 sm:py-10">
      <div className="foil-frame w-full max-w-6xl rounded-[2rem] shadow-2xl">
        <div className="flex flex-wrap overflow-hidden rounded-[calc(2rem-3px)] bg-card">
          <aside className="bg-felt relative flex flex-[1_1_420px] flex-col items-center justify-center p-[clamp(1.25rem,4vw,2.5rem)] pt-[clamp(4.5rem,10vw,5rem)] text-center">
            <div className="absolute top-[clamp(1rem,3vw,1.5rem)] right-[clamp(1rem,3vw,1.5rem)]">
              <ThemeDialog />
            </div>
            <Logo size="xl" stacked className="py-[clamp(1rem,4vw,3rem)]" />
          </aside>
          <section className="flex-[1_1_460px] p-5 sm:p-10 lg:p-12">{children}
            <ContactChannels />
          </section>
        </div>
      </div>
    </div>
  );
}
