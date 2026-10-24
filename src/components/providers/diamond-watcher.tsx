"use client";
/** แจ้ง toast เมื่อ Diamond ในโปรไฟล์เปลี่ยน ไม่ว่าจะเปลี่ยนจากการหมุนวงล้อ, realtime หรือการรีเฟรชข้อมูลก็ตาม */
import * as React from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-member";
import { pick } from "@/lib/api/shape";
import { toNumber } from "@/lib/format";
import { useAuth } from "./auth";

export function DiamondWatcher() {
  const { authenticated } = useAuth();
  const { data } = useProfile();
  const raw = pick(data, ["profile.rewards.diamonds", "rewards.diamonds", "diamond"]);
  const diamond = raw === undefined ? undefined : toNumber(raw);
  const prev = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (!authenticated) {
      prev.current = undefined;
      return;
    }
    if (diamond === undefined) return;
    const before = prev.current;
    prev.current = diamond;
    if (before === undefined || before === diamond) return;
    const d = diamond - before;
    toast(d > 0 ? `ได้รับ Diamond +${d.toLocaleString("th-TH")}` : `ใช้ Diamond ${Math.abs(d).toLocaleString("th-TH")}`, {
      description: `Diamond คงเหลือ ${diamond.toLocaleString("th-TH")}`,
    });
  }, [authenticated, diamond]);

  return null;
}
