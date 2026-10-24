"use client";
import useSWRInfinite from "swr/infinite";
import { ArrowDown, ArrowUp, Inbox, Loader2 } from "lucide-react";
import { normalizeTxns, txnLabel, txnTone } from "@/lib/api/normalize";
import { pick } from "@/lib/api/shape";
import { errorMessage } from "@/lib/api/errors";
import { baht, thaiDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** แบ่งหน้าแบบ cursor: ใช้ next_before ของหน้าก่อนหน้าเป็น before ของหน้าถัดไป */
export function TxnList({ kind, scope = "", fetcher }: { kind: "deposit" | "withdraw"; scope?: string; fetcher: (before?: string | number) => Promise<unknown> }) {
  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite(
    (i, prev) => {
      if (prev && !pick(prev, ["has_more"], false)) return null;
      return [`txn-${kind}-${scope}`, i === 0 ? null : pick<string | number>(prev, ["next_before"]) ?? null];
    },
    ([, before]) => fetcher((before as string | number | null) ?? undefined),
  );
  const rows = (data ?? []).flatMap((d) => normalizeTxns(d));
  const last = data?.[data.length - 1];
  const hasMore = last ? Boolean(pick(last, ["has_more"], false)) : false;
  const Icon = kind === "deposit" ? ArrowDown : ArrowUp;

  if (isLoading)
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-18" />
        ))}
      </div>
    );
  if (error) return <p className="text-destructive">{errorMessage(error)}</p>;
  if (!rows.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-10 text-muted-foreground">
        <Inbox className="size-10" />
        ยังไม่มีรายการ
      </div>
    );

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <li key={r.id || i} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full border border-gold-2", kind === "deposit" ? "bg-foil text-primary-foreground" : "text-brand")}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display font-bold">
                {kind === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}
                {r.channel ? ` · ${r.channel}` : ""}
              </div>
              <div className="text-xs text-muted-foreground">{thaiDateTime(r.createdAt)}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn("font-deco font-black tabular-nums", kind === "deposit" && "text-brand")}>
                {kind === "deposit" ? "+" : "-"}
                {baht(r.amount)}
              </span>
              <Badge variant={txnTone(r.status)}>{txnLabel(r.status)}</Badge>
            </div>
          </li>
        ))}
      </ul>
      {hasMore && (
        <Button variant="secondary" onClick={() => setSize(size + 1)} disabled={isValidating}>
          {isValidating && <Loader2 className="animate-spin" />} โหลดเพิ่ม
        </Button>
      )}
    </div>
  );
}
