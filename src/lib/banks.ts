/** สีประจำธนาคาร (ใช้ทำ chip ตัวย่อ ไม่ใช้โลโก้จริง) */
const COLORS: Record<string, string> = {
  KBANK: "#138F2D", SCB: "#4E2A84", BBL: "#1E4598", KTB: "#0A72A8", BAY: "#7A5A00", TTB: "#0050F0",
  GSB: "#C2185B", BAAC: "#2E7D32", UOB: "#0B3C7A", CIMB: "#7E1416", KKP: "#4B3B8F", LHB: "#5A6B7B",
  TISCO: "#164A8A", GHB: "#C35A00", ICBC: "#B71C1C", TRUEWALLET: "#C2410C",
};
export function bankColor(shortcode?: string) {
  return COLORS[(shortcode || "").toUpperCase()] ?? "#555B66";
}
