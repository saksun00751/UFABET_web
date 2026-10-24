"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Palette, Sun, Check } from "lucide-react";
import { THEME_PRESETS } from "@/lib/themes";
import { site } from "@/lib/site";
import { useThemePreset } from "@/components/providers/theme-preset";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme !== "light";
  return (
    <Button
      variant="secondary"
      size="icon"
      className={className}
      aria-label={dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Moon /> : <Sun />}
    </Button>
  );
}

export function ThemePresetGrid({ onPick }: { onPick?: () => void }) {
  const { preset, setPreset } = useThemePreset();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEME_PRESETS.map((t) => {
        const active = t.key === preset;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setPreset(t.key);
              onPick?.();
            }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 bg-secondary p-3 text-left transition-colors",
              active ? "border-gold-2" : "border-transparent hover:border-border",
            )}
            aria-pressed={active}
          >
            <span
              className="size-9 shrink-0 rounded-full border border-border"
              style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 0 50%, ${t.swatch[1]} 50% 100%)` }}
            />
            <span className="min-w-0 flex-1 font-deco text-xs font-bold tracking-wide leading-snug">{t.name}</span>
            {active && <Check className="size-4 text-brand" />}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  if (!site.themeSwitcher) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="icon" aria-label="เลือกธีม">
            <Palette />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ธีมและการแสดงผล</DialogTitle>
          <DialogDescription>เลือกสีธีมและโหมดมืด/สว่าง ระบบจะจำไว้ในเครื่องนี้</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 rounded-full bg-secondary p-1.5">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTheme(m)}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-full font-semibold",
                resolvedTheme === m ? "bg-gold-grad text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {m === "light" ? "สว่าง" : "มืด"}
            </button>
          ))}
        </div>
        <ThemePresetGrid />
      </DialogContent>
    </Dialog>
  );
}
