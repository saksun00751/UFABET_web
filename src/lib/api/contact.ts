import "server-only";
import { publicGet } from "./server";
import { contactHref } from "../contact-link";
import type { ContactChannel } from "./types";

/** ช่องทางติดต่อจาก GET /contact/channels (public, แคช 5 นาที) เรียงตาม sort — ล้มเหลว/ไม่มี = รายการว่าง */
export async function getContactChannels(): Promise<ContactChannel[]> {
  try {
    const d = await publicGet<{ channels?: ContactChannel[] }>("/contact/channels", 300);
    return (d.channels ?? []).map((c) => ({ ...c, link: contactHref(c) })).filter((c) => c.link).sort((a, b) => Number(a.sort) - Number(b.sort));
  } catch {
    return [];
  }
}
