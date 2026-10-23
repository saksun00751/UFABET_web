import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-foil text-primary-foreground font-bold glow hover:brightness-105",
        outline: "border border-gold-2 bg-transparent text-brand hover:bg-soft",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:brightness-95 dark:hover:brightness-125",
        soft: "bg-soft text-brand border border-gold-2 hover:brightness-110",
        ghost: "hover:bg-secondary text-foreground",
        destructive: "bg-destructive text-white hover:brightness-95",
        link: "text-brand underline-offset-4 hover:underline rounded-md",
        felt: "border border-gold-2 text-gold-1 bg-transparent hover:bg-white/5",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
