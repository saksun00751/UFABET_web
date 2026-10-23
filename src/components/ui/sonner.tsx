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
        classNames: {
          toast: "!rounded-2xl !border !border-border !bg-card !text-card-foreground !font-sans",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
export { Toaster };
