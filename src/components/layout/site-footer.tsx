import Link from "next/link";
import { getBranding } from "@/lib/api/branding";

export async function SiteFooter() {
  const { name } = await getBranding();
  return (
    <footer className="mt-12 border-t border-gold-3 bg-felt md:mt-20">
      <div className="bulbs opacity-60" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl 2xl:max-w-[1600px] flex-col items-center gap-5 px-4 py-7 text-center md:flex-row md:flex-wrap md:justify-between md:gap-6 md:py-9 md:text-left lg:px-6">
        <div className="flex flex-col items-center gap-1.5 md:items-start">
          <span className="text-foil font-deco text-xl font-black tracking-[0.12em] md:text-2xl">{name}</span>
          <span className="text-xs text-ivory-muted md:text-sm">
            © {new Date().getFullYear()} {name}
            <span className="hidden md:inline"> · </span>
            <br className="md:hidden" />
            สำหรับผู้มีอายุ 18 ปีขึ้นไป · โปรดเล่นอย่างมีสติ
          </span>
        </div>
        <nav aria-label="ลิงก์ท้ายเว็บ" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ivory-muted md:justify-start md:gap-x-6 md:text-sm">
          <Link href="/terms" className="hover:text-gold-1">เงื่อนไขการใช้งาน</Link>
          <Link href="/privacy" className="hover:text-gold-1">นโยบายความเป็นส่วนตัว</Link>
          <Link href="/contact" className="hover:text-gold-1">ติดต่อเรา</Link>
        </nav>
      </div>
    </footer>
  );
}
