import type { Metadata } from "next";

export const metadata: Metadata = { title: "นโยบายความเป็นส่วนตัว" };

export default function Page() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 py-8">
      <div className="font-deco text-xs font-bold tracking-[0.3em] text-brand">PRIVACY</div>
      <h1 className="font-display text-3xl font-bold">นโยบายความเป็นส่วนตัว</h1>
      <p className="leading-relaxed text-muted-foreground">[ใส่เนื้อหานโยบายความเป็นส่วนตัว ของเว็บไซต์]</p>
    </article>
  );
}
