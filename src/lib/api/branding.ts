import "server-only";
import { publicGet } from "./server";
import { site } from "../site";

export type Branding = { name: string; desc: string; logo: string | null };

const blankCache = new Map<string, boolean>();

/** รูปที่โปร่งใสทั้งภาพ (อัปโหลดมาเป็นภาพเปล่า) จะทำให้โลโก้หายไป → ตรวจด้วย sharp ถ้ามี ไม่มี/ตรวจไม่ได้ถือว่าใช้ได้ */
async function isBlankImage(url: string): Promise<boolean> {
  const hit = blankCache.get(url);
  if (hit !== undefined) return hit;
  let blank = false;
  try {
    const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000) });
    if (res.ok) {
      const { default: sharp } = await import("sharp");
      const { channels } = await sharp(Buffer.from(await res.arrayBuffer())).ensureAlpha().stats();
      blank = channels[3].max === 0;
    }
  } catch {
    blank = false;
  }
  blankCache.set(url, blank);
  return blank;
}

/** ข้อมูลเว็บไซต์/โลโก้จาก GET /site/branding (public, แคช 5 นาที) — ล้มเหลวหรือไม่มีค่า → ใช้ค่าจาก env */
export async function getBranding(): Promise<Branding> {
  const fallback: Branding = { name: site.name, desc: "", logo: null };
  try {
    const d = await publicGet<{ logo?: string | null; title?: string; desc?: string; sitename?: string }>("/site/branding", 300);
    const name = d.sitename?.trim() || fallback.name;
    const logo = d.logo?.trim() || null;
    // title ของ API เป็นประโยคโปรยยาว จึงใช้ sitename เป็นชื่อแท็บ และ desc/title เป็นคำอธิบายเว็บ
    return { name, desc: d.desc?.trim() || d.title?.trim() || "", logo: logo && !(await isBlankImage(logo)) ? logo : null };
  } catch {
    return fallback;
  }
}
