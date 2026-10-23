"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DiamondIcon } from "@/components/casino/icons";

/** error boundary ของหน้าสมาชิก — ผิดพลาดหน้าเดียว header/เมนูยังใช้ได้ */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-md py-10">
      <div className="foil-frame w-full rounded-[2rem]">
        <div className="bg-felt flex flex-col items-center gap-3 rounded-[calc(2rem-3px)] px-6 py-10 text-center">
          <DiamondIcon className="size-9 text-gold-2" />
          <div className="font-deco text-xs font-bold tracking-[0.35em] text-gold-2">SOMETHING WENT WRONG</div>
          <h1 className="font-display text-2xl font-bold text-ivory">เกิดข้อผิดพลาดในการโหลดหน้านี้</h1>
          <p className="text-sm text-ivory-muted">ลองใหม่อีกครั้ง หากยังไม่ได้กรุณาติดต่อเจ้าหน้าที่{error.digest ? ` (รหัส ${error.digest})` : ""}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>ลองใหม่</Button>
            <Button asChild variant="felt">
              <Link href="/">กลับหน้าแรก</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
