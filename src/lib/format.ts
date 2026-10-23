export function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

const money = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function baht(v: unknown, withSymbol = true) {
  const s = money.format(toNumber(v));
  return withSymbol ? `฿ ${s}` : s;
}

export function thaiDateTime(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function maskPhone(v?: string | null) {
  if (!v) return "";
  const s = v.replace(/\D/g, "");
  if (s.length < 7) return v;
  return `${s.slice(0, 3)}-xxx-${s.slice(-4)}`;
}

export function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}
