"use client";
import * as React from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { Info, Loader2, Share2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { referral, type Paged, type ReferralEarning, type ReferralMember } from "@/lib/api/member";
import { errorMessage } from "@/lib/api/errors";
import { baht, thaiDateTime } from "@/lib/format";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReferralPage() {
  return (
    <AuthGuard>
      <Referral />
    </AuthGuard>
  );
}

function Referral() {
  const ov = useSWR("referral/overview", referral.overview);
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => setOrigin(window.location.origin), []);
  const d = ov.data;
  const link = d ? d.referral_link || `${origin}${d.referral_path}` : "";

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "สมัครสมาชิก", url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast.success("คัดลอกลิงก์แล้ว");
      }
    } catch {}
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="แนะนำเพื่อน" />
      {ov.isLoading ? (
        <Skeleton className="h-72 rounded-3xl" />
      ) : ov.error || !d ? (
        <p className="text-destructive">{errorMessage(ov.error)}</p>
      ) : (
        <Card className="bg-felt border-gold-2">
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="bg-foil chip flex size-14 items-center justify-center text-primary-foreground" style={{ ["--chip-gap" as string]: "var(--felt)" }}>
                <UsersRound className="size-6" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ivory">ชวนเพื่อนสมัคร รับค่าคอมมิชชัน</h2>
                <div className="text-sm text-ivory-muted">
                  รหัสแนะนำของคุณ <b className="text-foil font-deco text-lg font-black tracking-widest">{d.referral_code}</b>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["เพื่อนที่สมัคร", `${d.active_direct_members} / ${d.direct_members} คน`],
                ["ค่าคอมมิชชัน", d.commission_display],
                ["รายได้รวม", baht(d.earned_total)],
                ["FASTSTART รอโยก", baht(d.available_faststart)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-gold-2/40 px-4 py-3">
                  <div className="text-xs text-ivory-muted">{k}</div>
                  <div className="font-deco text-lg font-black text-gold-1">{v}</div>
                </div>
              ))}
            </div>
            {!d.commission_enabled && (
              <div className="flex gap-2 rounded-2xl border border-gold-2/40 p-3 text-sm text-ivory-muted">
                <Info className="size-5 shrink-0 text-gold-2" /> ขณะนี้โปรค่าแนะนำ (FASTSTART) ปิดชั่วคราว เพื่อนยังสมัครผ่านลิงก์ของคุณได้ตามปกติ
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-dashed border-gold-2 bg-card p-1.5 pl-4">
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{link}</span>
              <CopyButton value={link} label="คัดลอกลิงก์" />
            </div>
            <Button onClick={share}>
              <Share2 /> แชร์ลิงก์ให้เพื่อน
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">รายชื่อเพื่อน</TabsTrigger>
          <TabsTrigger value="earnings">ประวัติรายได้</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <PagedList<ReferralMember>
            k="ref-members"
            fetcher={(p) => referral.members(p)}
            render={(m) => (
              <div className="flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3.5">
                <div>
                  <div className="font-semibold">{m.username_masked}</div>
                  <div className="text-xs text-muted-foreground">สมัคร {thaiDateTime(m.registered_at)}</div>
                </div>
                <Badge variant={/active|y/i.test(m.status) ? "success" : "outline"}>{m.status}</Badge>
              </div>
            )}
          />
        </TabsContent>
        <TabsContent value="earnings">
          <PagedList<ReferralEarning>
            k="ref-earnings"
            fetcher={(p) => referral.earnings(p)}
            render={(e) => (
              <div className="flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3.5">
                <div>
                  <div className="font-semibold">{e.username_masked}</div>
                  <div className="text-xs text-muted-foreground">
                    {thaiDateTime(e.created_at)} · ยอดคำนวณ {baht(e.qualifying_amount)}
                  </div>
                </div>
                <span className="font-display font-semibold text-success">+{baht(e.earned_amount)}</span>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PagedList<T>({ k, fetcher, render }: { k: string; fetcher: (page: number) => Promise<Paged<T>>; render: (item: T) => React.ReactNode }) {
  const { data, size, setSize, isLoading, isValidating, error } = useSWRInfinite(
    (i, prev: Paged<T> | null) => (prev && !prev.has_more ? null : [k, i + 1]),
    ([, p]) => fetcher(p as number),
  );
  const items = (data ?? []).flatMap((d) => d.items ?? d.data ?? []);
  const hasMore = data?.[data.length - 1]?.has_more;
  if (isLoading) return <Skeleton className="h-40" />;
  if (error) return <p className="text-destructive">{errorMessage(error)}</p>;
  if (!items.length) return <p className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">ยังไม่มีข้อมูล</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <React.Fragment key={i}>{render(it)}</React.Fragment>
      ))}
      {hasMore && (
        <Button variant="secondary" onClick={() => setSize(size + 1)} disabled={isValidating}>
          {isValidating && <Loader2 className="animate-spin" />} โหลดเพิ่ม
        </Button>
      )}
    </div>
  );
}
