import "server-only";
import { headers as nextHeaders } from "next/headers";
import { readSession, tryWriteSession } from "../session-store";
import { ApiError, type ApiEnvelope } from "./client";

/**
 * Member API v1 (Laravel) — เรียกจากฝั่ง server เท่านั้น
 * Laravel ใช้ session cookie + CSRF จึงเก็บ cookie ไว้ในเซสชันเข้ารหัสของแอปนี้ (session-core.ts)
 * แล้วแนบกลับทุกคำขอ browser ไม่เห็น cookie ของ Laravel และไม่เรียก Laravel ตรง
 */
const API_PREFIX = "/api/member/v1";
const ORIGIN = (process.env.MEMBER_API_ORIGIN || "").trim().replace(/\/+$/, "").replace(API_PREFIX, "");

/** cookie jar + CSRF token ของ Laravel session หนึ่งอัน */
export type Backend = { jar: Record<string, string>; csrf?: string };

type Query = Record<string, string | number | boolean | undefined | null>;
type Opts = {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
};

function absorbCookies(res: Response, state: Backend) {
  for (const line of res.headers.getSetCookie()) {
    const [pair, ...attrs] = line.split(";");
    const i = pair.indexOf("=");
    if (i < 1) continue;
    const name = pair.slice(0, i).trim();
    const value = pair.slice(i + 1).trim();
    const lower = attrs.map((a) => a.trim().toLowerCase());
    const expired =
      lower.includes("max-age=0") || lower.some((a) => a.startsWith("expires=") && Date.parse(a.slice(8)) < Date.now());
    if (!value || expired) delete state.jar[name];
    else state.jar[name] = value;
  }
}

const cookieHeader = (jar: Record<string, string>) =>
  Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

function csrfHeaders(state: Backend): Record<string, string> {
  if (state.csrf) return { "X-CSRF-TOKEN": state.csrf };
  const xsrf = state.jar["XSRF-TOKEN"];
  return xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {};
}

function qs(query?: Query) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function toError(status: number, json: ApiEnvelope<unknown> | null): ApiError {
  const code = json?.error?.code ?? (status === 419 ? "CSRF_TOKEN_MISMATCH" : status === 429 ? "RATE_LIMITED" : `HTTP_${status}`);
  const message = json?.error?.message ?? json?.message ?? "เกิดข้อผิดพลาด";
  const fields = json?.error?.errors ?? json?.error?.fields ?? json?.errors ?? {};
  // 5xx จาก gateway/timeout บนเส้นเงิน = ไม่แน่ใจผล
  return new ApiError(status, code, message, fields, status === 502 || status === 504);
}

async function internalHeaders(): Promise<Record<string, string>> {
  // X-Member-IP: IP ผู้ใช้จริง (ให้ rate-limit ของ backend นับต่อผู้ใช้ ไม่ใช่ต่อ IP ของเซิร์ฟเวอร์นี้)
  // X-Internal-Token: ยืนยันว่าคำขอมาจาก Next.js server นี้
  const out: Record<string, string> = {};
  const token = process.env.API_INTERNAL_TOKEN;
  if (token) out["X-Internal-Token"] = token;
  try {
    const h = await nextHeaders();
    const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
    if (ip) {
      out["X-Member-IP"] = ip;
      out["X-Forwarded-For"] = ip;
    }
    const ua = h.get("user-agent");
    if (ua) out["User-Agent"] = ua;
    const lang = h.get("accept-language");
    if (lang) out["Accept-Language"] = lang;
  } catch {
    // นอก request scope
  }
  return out;
}

/** ยิงคำขอหนึ่งครั้ง โดยอัปเดต state (cookie jar / csrf) ตามที่ backend ตอบ */
export async function call<T>(path: string, opts: Opts, state: Backend, retryCsrf = true): Promise<T> {
  if (!ORIGIN) throw new ApiError(500, "API_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า MEMBER_API_ORIGIN");
  const method = opts.method ?? "GET";

  if (method === "POST" && !state.csrf && !state.jar["XSRF-TOKEN"]) await refreshCsrf(state);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(await internalHeaders()),
    ...opts.headers,
  };
  const cookie = cookieHeader(state.jar);
  if (cookie) headers.Cookie = cookie;
  if (method === "POST") {
    Object.assign(headers, csrfHeaders(state));
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${ORIGIN}${API_PREFIX}${path}${qs(opts.query)}`, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(opts.body ?? {}) : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    const timeout = (e as Error)?.name === "TimeoutError";
    throw new ApiError(timeout ? 504 : 0, timeout ? "UPSTREAM_TIMEOUT" : "NETWORK_ERROR", "ระบบปลายทางไม่ตอบสนอง กรุณาลองใหม่", {}, true);
  }
  absorbCookies(res, state);

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T & { csrf_token?: string }> | null;
  const data = json?.data;
  if (data && typeof data === "object" && typeof data.csrf_token === "string") state.csrf = data.csrf_token;

  // 419 = คำขอยังไม่ถูกประมวลผล ปลอดภัยที่จะขอ CSRF ใหม่แล้วลองซ้ำหนึ่งครั้ง
  if (res.status === 419 && retryCsrf) {
    await refreshCsrf(state);
    return call<T>(path, opts, state, false);
  }
  if (!res.ok || json?.success === false) throw toError(res.status, json);
  return (data ?? bareBody(json)) as T;
}

/** บาง endpoint (เช่น deposit/loadbank) ส่งฟิลด์ที่ระดับบนสุดโดยไม่มี data ครอบ */
function bareBody(json: object | null): object {
  if (!json) return {};
  const { success: _s, message: _m, error: _e, ...rest } = json as Record<string, unknown>;
  return rest;
}

export async function refreshCsrf(state: Backend) {
  const d = await call<{ csrf_token?: string }>("/session/csrf", {}, state);
  state.csrf = d.csrf_token ?? state.csrf;
  if (!state.csrf && !state.jar["XSRF-TOKEN"]) throw new ApiError(503, "CSRF_UNAVAILABLE", "ไม่สามารถเริ่ม Session ได้");
}

/** เริ่ม Laravel session ใหม่ (ใช้ตอน login เพื่อไม่ต่อ session เดิม) — ได้ cookie + CSRF token */
export async function freshBackend(): Promise<Backend> {
  const state: Backend = { jar: {} };
  await refreshCsrf(state);
  return state;
}

/**
 * เรียก API ในนามของผู้ใช้ปัจจุบัน (ใช้ cookie ในเซสชัน) — ไม่มีเซสชันก็เรียกแบบ guest
 * cookie/CSRF ที่ backend หมุนใหม่จะถูกบันทึกกลับถ้าอยู่ใน Server Action (ใน Server Component จะข้ามไป)
 * guest ที่ POST (เช่น register/preflight) จะได้เซสชัน "pending" ไว้ต่อเนื่องไปขั้น submit
 */
export async function apiFetch<T>(path: string, opts: Opts = {}): Promise<T> {
  const stored = await readSession();
  const state: Backend = { jar: { ...(stored?.jar ?? {}) }, csrf: stored?.csrf };
  const before = JSON.stringify([state.jar, state.csrf]);
  try {
    return await call<T>(path, opts, state);
  } finally {
    if (JSON.stringify([state.jar, state.csrf]) !== before) {
      if (stored) await tryWriteSession({ ...stored, jar: state.jar, csrf: state.csrf });
      else if (opts.method === "POST") await tryWriteSession({ jar: state.jar, csrf: state.csrf, status: "pending" });
    }
  }
}

/**
 * GET endpoint สาธารณะ (ไม่ใช้ session/cookie) แคชข้าม request ด้วย Next data cache —
 * ใช้กับข้อมูลที่ไม่ขึ้นกับผู้ใช้ เช่น รายชื่อธนาคาร (revalidate = 0 → ไม่แคช)
 */
export async function publicGet<T>(path: string, revalidate: number, query?: Query): Promise<T> {
  if (!ORIGIN) throw new ApiError(500, "API_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า MEMBER_API_ORIGIN");
  let res: Response;
  try {
    res = await fetch(`${ORIGIN}${API_PREFIX}${path}${qs(query)}`, {
      headers: { Accept: "application/json", ...(await internalHeaders()) },
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "ระบบปลายทางไม่ตอบสนอง กรุณาลองใหม่", {}, true);
  }
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || json?.success === false) throw toError(res.status, json);
  return (json?.data ?? {}) as T;
}
