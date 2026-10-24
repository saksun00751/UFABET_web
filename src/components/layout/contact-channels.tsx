import Link from "next/link";
import { Headset } from "lucide-react";

/** ทางเข้าหน้า /contact สำหรับผู้ที่ยังไม่ได้ login */
export function ContactChannels() {
  return (
    <div className="mt-8 flex justify-center border-t border-border pt-6">
      <Link
        href="/contact"
        className="inline-flex items-center gap-2 rounded-full border border-gold-2 bg-soft px-5 py-2.5 font-display text-sm font-semibold text-brand transition-colors hover:bg-card"
      >
        <Headset className="size-5" />
        ติดต่อเจ้าหน้าที่ 24 ชม.
      </Link>
    </div>
  );
}
