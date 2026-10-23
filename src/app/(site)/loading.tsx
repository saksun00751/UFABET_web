import { Chip } from "@/components/casino/ornament";

export default function Loading() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <Chip className="size-16 animate-spin text-sm [animation-duration:2.4s]" gap="var(--background)">
        ♠
      </Chip>
      <span className="font-deco text-xs font-bold tracking-[0.35em] text-brand">LOADING</span>
    </div>
  );
}
