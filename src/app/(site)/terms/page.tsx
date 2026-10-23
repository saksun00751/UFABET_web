import type { Metadata } from "next";

export const metadata: Metadata = { title: "เงื่อนไขการใช้งาน" };

export default function Page() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 py-8">
      <div className="font-deco text-xs font-bold tracking-[0.3em] text-brand">HOUSE RULES</div>
      <h1 className="font-display text-3xl font-bold">เงื่อนไขการใช้งาน</h1>
      <p className="leading-relaxed text-muted-foreground">[ใส่เนื้อหาเงื่อนไขการใช้งาน ของเว็บไซต์]</p>
    </article>
  );
}
