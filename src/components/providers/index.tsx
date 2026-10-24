"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { ThemePresetProvider } from "./theme-preset";
import { AuthProvider } from "./auth";
import { RealtimeBridge } from "./realtime";
import { site } from "@/lib/site";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme={site.defaultMode} forcedTheme={site.themeSwitcher ? undefined : site.defaultMode} enableSystem={false} disableTransitionOnChange>
      <ThemePresetProvider>
        <SWRConfig value={{ revalidateOnFocus: true, dedupingInterval: 3000, errorRetryCount: 2 }}>
          <AuthProvider>
            <RealtimeBridge />
            {children}
            <Toaster />
          </AuthProvider>
        </SWRConfig>
      </ThemePresetProvider>
    </ThemeProvider>
  );
}
