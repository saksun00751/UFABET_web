/**
 * ตัวช่วยอ่าน response ที่เอกสารยังไม่ระบุ schema ละเอียด (เส้นหลัง Login ส่วนใหญ่)
 * ถ้า backend ยืนยัน field จริงแล้ว ให้แก้ที่ src/lib/api/member.ts จุดเดียว
 */
export type Dict = Record<string, unknown>;

export function isDict(v: unknown): v is Dict {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function pick<T = unknown>(obj: unknown, keys: string[], fallback?: T): T | undefined {
  if (!isDict(obj)) return fallback;
  for (const k of keys) {
    const parts = k.split(".");
    let cur: unknown = obj;
    for (const p of parts) cur = isDict(cur) ? cur[p] : undefined;
    if (cur !== undefined && cur !== null && cur !== "") return cur as T;
  }
  return fallback;
}

export function pickStr(obj: unknown, keys: string[], fallback = ""): string {
  const v = pick(obj, keys);
  return v === undefined || v === null ? fallback : String(v);
}

/** หา array แรกใน data (รองรับ {items:[]}, {data:[]}, {list:[]}, [] ตรงๆ) */
export function asList<T = Dict>(data: unknown, prefer: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!isDict(data)) return [];
  for (const k of [...prefer, "items", "data", "list", "rows", "results"]) {
    const v = data[k];
    if (Array.isArray(v)) return v as T[];
    if (isDict(v) && Array.isArray(v.data)) return v.data as T[];
  }
  const first = Object.values(data).find(Array.isArray);
  return (first as T[]) ?? [];
}

export type Page = { page: number; perPage: number; total?: number; hasMore: boolean };

export function asPage(data: unknown, fallbackPage = 1): Page {
  const meta = isDict(data) && isDict(data.meta) ? data.meta : data;
  const page = Number(pick(meta, ["page", "current_page"], fallbackPage));
  const perPage = Number(pick(meta, ["per_page"], 20));
  const total = pick<number>(meta, ["total"]);
  const lastPage = pick<number>(meta, ["last_page"]);
  const hasMore = Boolean(pick(meta, ["has_more"], lastPage ? page < Number(lastPage) : false));
  return { page, perPage, total: total !== undefined ? Number(total) : undefined, hasMore };
}
