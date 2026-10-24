export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "LUXURA",
  /** เปิด/ปิดปุ่มเลือกธีมทุกจุด (NEXT_PUBLIC_THEME_SWITCHER=false เพื่อปิด) */
  themeSwitcher: process.env.NEXT_PUBLIC_THEME_SWITCHER !== "false",
  /** เปิด/ปิดการสมัครสมาชิก (NEXT_PUBLIC_REGISTRATION=false เพื่อปิด) */
  registration: process.env.NEXT_PUBLIC_REGISTRATION !== "false",
};
