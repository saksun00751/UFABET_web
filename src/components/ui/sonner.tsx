"use client";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "dark"}
      position="top-center"
      toastOptions={{
        // ขอบหนา + เงา + พื้นผสมสีตามประเภท ให้แยกออกจากพื้นหลังของทุกธีม (ทั้งสว่างและมืด)
        classNames: {
          toast: "!rounded-2xl !border-2 !border-primary !bg-card !text-card-foreground !font-sans !shadow-[0_10px_32px_rgba(0,0,0,.45),0_0_0_1px_rgba(0,0,0,.25)] data-[type=success]:!border-success data-[type=success]:!bg-[color-mix(in_srgb,var(--success)_20%,var(--card))] data-[type=error]:!border-destructive data-[type=error]:!bg-[color-mix(in_srgb,var(--destructive)_20%,var(--card))] data-[type=warning]:!border-warning data-[type=warning]:!bg-[color-mix(in_srgb,var(--warning)_20%,var(--card))] data-[type=info]:!bg-[color-mix(in_srgb,var(--primary)_16%,var(--card))]",
          title: "!font-semibold",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
export { Toaster };
