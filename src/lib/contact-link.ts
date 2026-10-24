import type { ContactChannel } from "./api/types";

/**
 * backend ส่ง `link` เป็นได้ทั้ง URL เต็มหรือแค่ไอดี (เช่น type=line, link=MCCC)
 * แปลงให้เป็น href ที่กดแล้วใช้งานได้ตามชนิดช่องทาง
 */
export function contactHref({ type, link }: Pick<ContactChannel, "type" | "link">): string {
  const v = String(link ?? "").trim();
  if (!v) return "";
  if (/^(https?:\/\/|tel:|mailto:|line:\/\/|tg:)/i.test(v)) return v;
  const t = String(type ?? "").toLowerCase();
  if (/line/.test(t)) return `https://line.me/R/ti/p/${v.startsWith("@") ? v : `~${v}`}`;
  if (/telegram/.test(t)) return `https://t.me/${v.replace(/^@/, "")}`;
  if (/tel|phone|โทร/.test(t) || /^[+\d][\d\s-]{6,}$/.test(v)) return `tel:${v.replace(/[\s-]/g, "")}`;
  if (/mail/.test(t) || /^\S+@\S+\.\S+$/.test(v)) return `mailto:${v}`;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) return `https://${v}`;
  return "";
}
