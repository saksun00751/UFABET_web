import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-gold-3 bg-felt">
      <div className="bulbs opacity-60" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-9 lg:px-6">
        <div className="flex flex-col gap-1">
          <span className="text-foil font-deco text-2xl font-black tracking-[0.12em]">{site.name}</span>
          <span className="text-sm text-ivory-muted">© {new Date().getFullYear()} {site.name} · สำหรับผู้มีอายุ 18 ปีขึ้นไป · โปรดเล่นอย่างมีสติ</span>
        </div>
        <nav aria-label="ลิงก์ท้ายเว็บ" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ivory-muted">
          <Link href="/terms" className="hover:text-gold-1">เงื่อนไขการใช้งาน</Link>
          <Link href="/privacy" className="hover:text-gold-1">นโยบายความเป็นส่วนตัว</Link>
          {site.supportUrl && (
            <a href={site.supportUrl} target="_blank" rel="noreferrer" className="hover:text-gold-1">
              ติดต่อเรา
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
