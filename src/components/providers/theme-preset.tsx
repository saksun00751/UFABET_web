"use client";
import * as React from "react";
import { site } from "@/lib/site";
import { DEFAULT_PRESET, THEME_STORAGE_KEY, isPreset, type ThemePresetKey } from "@/lib/themes";

type Ctx = { preset: ThemePresetKey; setPreset: (k: ThemePresetKey) => void };
const ThemePresetContext = React.createContext<Ctx>({ preset: DEFAULT_PRESET, setPreset: () => {} });

export function ThemePresetProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = React.useState<ThemePresetKey>(DEFAULT_PRESET);

  React.useEffect(() => {
    if (!site.themeSwitcher) return; // ล็อกตาม .env: ไม่อ่านค่าที่เคยบันทึกในเครื่อง
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isPreset(saved)) setPresetState(saved);
    } catch {}
  }, []);

  const setPreset = React.useCallback((k: ThemePresetKey) => {
    if (!site.themeSwitcher) return;
    setPresetState(k);
    document.documentElement.dataset.theme = k;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, k);
    } catch {}
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = preset;
  }, [preset]);

  return <ThemePresetContext.Provider value={{ preset, setPreset }}>{children}</ThemePresetContext.Provider>;
}

export const useThemePreset = () => React.useContext(ThemePresetContext);

/** inline script ใส่ใน <head> กัน theme กระพริบตอนโหลด */
export const themePresetScript = site.themeSwitcher
  ? `(function(){try{var k=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(k)document.documentElement.dataset.theme=k;}catch(e){}})();`
  : `document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_PRESET)};`;
