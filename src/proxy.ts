import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, unsealSession } from "@/lib/session-core";

/**
 * - หน้าแรก: สมาชิกเท่านั้น — ยังไม่ login ส่งไป /login ตั้งแต่ฝั่ง server (ไม่ให้หน้าแรกกระพริบ)
 * - /login, /register: login อยู่แล้วเข้าไม่ได้ — ส่งกลับหน้าแรก (หรือ ?next= ที่ปลอดภัย)
 */
export async function proxy(req: NextRequest) {
  const session = await unsealSession(req.cookies.get(SESSION_COOKIE)?.value);
  const authenticated = session?.status === "authenticated";
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/") {
    return authenticated ? NextResponse.next() : NextResponse.redirect(new URL("/login", req.url));
  }
  if (authenticated) {
    const next = searchParams.get("next");
    const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(dest, req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/register"] };
