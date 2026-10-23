"use client";
import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "คัดลอก", className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button
      type="button"
      variant="soft"
      size="icon"
      className={className}
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success("คัดลอกแล้ว");
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("คัดลอกไม่สำเร็จ");
        }
      }}
    >
      {done ? <Check /> : <Copy />}
    </Button>
  );
}
