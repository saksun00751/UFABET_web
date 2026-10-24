import type { Metadata } from "next";
import { ChevronRight, Headset, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { getContactChannels } from "@/lib/api/contact";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "ติดต่อเจ้าหน้าที่" };

function iconFor(type: string, link: string) {
  const t = `${type} ${link}`.toLowerCase();
  if (/tel|phone|โทร/.test(t)) return Phone;
  if (/mail/.test(t)) return Mail;
  if (/telegram|t\.me/.test(t)) return Send;
  if (/line|chat|messenger|facebook|fb\./.test(t)) return MessageCircle;
  return Headset;
}

export default async function ContactPage() {
  const channels = await getContactChannels();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-8">
      <div>
        <div className="font-deco text-xs font-bold tracking-[0.3em] text-brand">CONCIERGE</div>
        <h1 className="font-display text-2xl leading-snug font-bold lg:text-3xl">ติดต่อเจ้าหน้าที่</h1>
        <p className="mt-1 text-sm text-muted-foreground">พร้อมดูแลตลอด 24 ชั่วโมง เลือกช่องทางที่สะดวกได้เลย</p>
      </div>
      {channels.length ? (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {channels.map((c) => {
              const Icon = iconFor(c.type, c.link);
              return (
                <li key={c.code}>
                  <a href={c.link} target="_blank" rel="noreferrer" className="flex min-h-16 items-center gap-4 px-5 hover:bg-secondary">
                    <span className="bg-foil flex size-10 items-center justify-center rounded-full text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="font-semibold">{c.label || c.type}</span>
                      <span className="text-xs text-muted-foreground uppercase">{c.type}</span>
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">ยังไม่ได้ตั้งค่าช่องทางติดต่อ</Card>
      )}
    </div>
  );
}
