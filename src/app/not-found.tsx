import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpadeIcon } from "@/components/casino/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="foil-frame w-full max-w-md rounded-[2rem]">
        <div className="bg-felt flex flex-col items-center gap-3 rounded-[calc(2rem-3px)] px-6 py-12 text-center">
          <SpadeIcon className="size-10 text-gold-2" />
          <div className="text-foil font-deco text-7xl font-black">404</div>
          <div className="font-deco text-xs font-bold tracking-[0.35em] text-gold-2">TABLE NOT FOUND</div>
          <p className="text-ivory-muted">ไม่พบหน้าที่คุณต้องการ</p>
          <Button asChild className="mt-2">
            <Link href="/">กลับหน้าแรก</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
