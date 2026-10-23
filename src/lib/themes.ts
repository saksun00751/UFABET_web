export const THEME_PRESETS = [
  { key: "royal", name: "Royal Gold", swatch: ["#E2B857", "#120F0A"] },
  { key: "rose", name: "Rose Gold", swatch: ["#E3A587", "#160E0E"] },
  { key: "champagne", name: "Champagne", swatch: ["#E9D8A6", "#151412"] },
  { key: "emerald", name: "Emerald Felt", swatch: ["#E2B857", "#072218"] },
  { key: "burgundy", name: "Burgundy Velvet", swatch: ["#E2B857", "#220A12"] },
  { key: "sapphire", name: "Sapphire Royale", swatch: ["#E2B857", "#0B1426"] },
] as const;

export type ThemePresetKey = (typeof THEME_PRESETS)[number]["key"];

export const THEME_STORAGE_KEY = "royal-theme-preset";

export const DEFAULT_PRESET: ThemePresetKey = (() => {
  const env = process.env.NEXT_PUBLIC_DEFAULT_THEME;
  return (THEME_PRESETS.find((t) => t.key === env)?.key ?? "royal") as ThemePresetKey;
})();

export function isPreset(v: unknown): v is ThemePresetKey {
  return typeof v === "string" && THEME_PRESETS.some((t) => t.key === v);
}
