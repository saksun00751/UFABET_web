import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, unsealSession } from "@/lib/session-core";

/** หน้าแรกสำหรับสมาชิกเท่านั้น: ยังไม่ login ส่งไป /login ตั้งแต่ฝั่ง server (ไม่ให้หน้าแรกกระพริบ) */
export async function proxy(req: NextRequest) {
  const session = await unsealSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session?.status === "authenticated") return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/"] };
