import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-13 w-full min-w-0 rounded-2xl border border-input bg-secondary px-4 text-base text-foreground placeholder:text-muted-foreground/80 transition-[color,box-shadow,border-color] outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
