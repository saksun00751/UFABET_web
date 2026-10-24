export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "LUXURA",
  /** เปิด/ปิดปุ่มเลือกธีมทุกจุด (NEXT_PUBLIC_THEME_SWITCHER=false เพื่อปิด) */
  themeSwitcher: process.env.NEXT_PUBLIC_THEME_SWITCHER !== "false",
  /** โหมดมืด/สว่างเริ่มต้น (NEXT_PUBLIC_DEFAULT_MODE=light|dark) — ถ้าปิดปุ่มเลือกธีมจะล็อกตามค่านี้ */
  defaultMode: process.env.NEXT_PUBLIC_DEFAULT_MODE === "light" ? "light" : "dark",
  /** เปิด/ปิดการสมัครสมาชิก (NEXT_PUBLIC_REGISTRATION=false เพื่อปิด) */
  registration: process.env.NEXT_PUBLIC_REGISTRATION !== "false",
};
