"use client";
import * as React from "react";
import { Loader2, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { bonus } from "@/lib/api/member";
import { errorMessage } from "@/lib/api/errors";
import { useBonusWallet } from "@/hooks/use-member";
import { useIdempotentKey } from "@/hooks/use-idempotent";
import { baht, toNumber } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function BonusWalletCard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, error, mutate } = useBonusWallet();
  const { mutate: gm } = useSWRConfig();
  const idem = useIdempotentKey("bonus");
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const wheel = toNumber(data?.wheel_bonus);
  const items = [
    { k: "วงล้อ", v: data?.wheel_bonus },
    { k: "คืนยอดเสีย", v: data?.cashback },
    { k: "IC", v: data?.ic },
    { k: "แนะนำเพื่อน", v: data?.faststart },
  ];

  async function transfer() {
    setBusy(true);
    try {
      const r = await bonus.transfer(idem.current());
      idem.settle();
      toast.success(`โยกโบนัส ${baht(r.amount)} เข้าเกมสำเร็จ`, { description: `อ้างอิง ${r.ref_id}` });
      setOpen(false);
      await Promise.all([mutate(), gm("member/balance")]);
    } catch (e) {
      idem.settle(e);
      toast.error(errorMessage(e));
      mutate();
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Skeleton className="h-44 rounded-3xl" />;
  if (error || !data) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">กระเป๋าโบนัส</h2>
          {data.pending_reconciliation ? (
            <Badge variant="warning">รอตรวจสอบรายการ</Badge>
          ) : data.eligible && wheel > 0 ? (
            <Badge variant="success">พร้อมโยก</Badge>
          ) : null}
        </div>
        <div className={compact ? "grid grid-cols-2 gap-2 text-center sm:grid-cols-4" : "grid grid-cols-2 gap-3 sm:grid-cols-4"}>
          {items.map((i) => (
            <div key={i.k} className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-secondary px-2 py-2.5">
              <div className="text-xs whitespace-nowrap text-muted-foreground">{i.k}</div>
              <div className="font-deco font-black text-brand tabular-nums">{baht(i.v, false)}</div>
            </div>
          ))}
        </div>
        {idem.uncertain && (
          <div className="flex gap-2 rounded-2xl bg-warning/10 p-3 text-sm text-warning">
            <ShieldAlert className="size-5 shrink-0" /> ยังไม่ทราบผลรายการล่าสุด ห้ามทำซ้ำด้วยรายการใหม่ — กดยืนยันอีกครั้งจะใช้รายการเดิม หรือติดต่อเจ้าหน้าที่
          </div>
        )}
        <Button variant="soft" disabled={!data.eligible || wheel <= 0 || data.pending_reconciliation} onClick={() => setOpen(true)}>
          <ArrowRightLeft /> โยกโบนัสวงล้อทั้งหมดเข้าเกม
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันโยกโบนัสเข้าเกม</DialogTitle>
            <DialogDescription>ระบบจะโยกยอดโบนัสวงล้อทั้งหมดเข้าบัญชีเกม UFA ไม่สามารถยกเลิกได้</DialogDescription>
          </DialogHeader>
          <div className="foil-frame rounded-3xl"><div className="bg-felt rounded-[calc(1.5rem-3px)] p-5 text-center">
            <div className="font-deco text-xs font-bold tracking-[0.3em] text-gold-2">TRANSFER</div>
            <div className="text-foil font-deco text-4xl font-black">{baht(data.wheel_bonus)}</div>
          </div></div>
          <Button size="lg" onClick={transfer} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} ยืนยันโยก
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
