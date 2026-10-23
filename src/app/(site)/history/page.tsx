"use client";
import { transactions } from "@/lib/api/member";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { TxnList } from "@/components/member/txn-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HistoryPage() {
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
            <TxnList kind="deposit" fetcher={(p) => transactions.deposits(p)} />
          </TabsContent>
          <TabsContent value="withdraw">
            <TxnList kind="withdraw" fetcher={(p) => transactions.withdrawals(p)} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
