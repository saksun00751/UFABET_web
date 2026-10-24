"use client";
import useSWR from "swr";
import { transactions, withdraw } from "@/lib/api/member";
import { pickStr } from "@/lib/api/shape";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { TxnList } from "@/components/member/txn-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WITHDRAW_MODES = ["standard", "free", "seamless", "seamless_free"];

export default function HistoryPage() {
  // /transactions/withdrawals ต้องระบุ mode — ใช้ mode เดียวกับที่ eligibility ระบุ
  const elig = useSWR("withdraw/eligibility", withdraw.eligibility);
  // backend รับเฉพาะ 4 ค่านี้ — ค่าอื่นจาก eligibility (หรือยังโหลดไม่เสร็จ) ใช้ standard
  const raw = pickStr(elig.data, ["mode", "withdraw_mode"], "standard");
  const mode = WITHDRAW_MODES.includes(raw) ? raw : "standard";
  return (
    <AuthGuard>
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <PageHeader title="ประวัติฝาก-ถอน" back={false} />
        <Tabs defaultValue="deposit">
          <TabsList>
            <TabsTrigger value="deposit">ประวัติฝาก</TabsTrigger>
            <TabsTrigger value="withdraw">ประวัติถอน</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">
            <TxnList kind="deposit" fetcher={(b) => transactions.deposits(b)} />
          </TabsContent>
          <TabsContent value="withdraw">
            <TxnList kind="withdraw" scope={mode} fetcher={(b) => transactions.withdrawals(mode, b)} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
