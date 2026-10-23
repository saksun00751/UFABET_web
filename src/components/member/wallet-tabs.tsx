import Link from "next/link";
import { cn } from "@/lib/utils";

export function WalletTabs({ active }: { active: "deposit" | "withdraw" }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-full border border-border bg-card p-1.5" role="tablist">
      {(
        [
          ["deposit", "/deposit", "ฝากเงิน"],
          ["withdraw", "/withdraw", "ถอนเงิน"],
        ] as const
      ).map(([k, href, label]) => (
        <Link
          key={k}
          href={href}
          role="tab"
          aria-selected={active === k}
          className={cn(
            "flex h-12 items-center justify-center rounded-full font-display text-base font-semibold",
            active === k ? "bg-gold-grad text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
