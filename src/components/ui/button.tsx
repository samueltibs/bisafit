import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96] active:transition-transform active:duration-100",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[hsl(145_52%_65%)] to-[hsl(145_52%_55%)] text-[hsl(220_22%_7%)] shadow-[0_2px_8px_rgba(111,207,151,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_16px_rgba(111,207,151,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-[hsl(145_52%_68%)] hover:to-[hsl(145_52%_58%)]",
        destructive:
          "bg-gradient-to-b from-destructive to-[hsl(0_79%_55%)] text-destructive-foreground shadow-[0_2px_8px_rgba(235,87,87,0.3)] hover:shadow-[0_4px_12px_rgba(235,87,87,0.4)]",
        outline:
          "border border-border/60 bg-transparent text-foreground hover:bg-secondary/50 hover:border-border active:shadow-[0_0_0_2px_rgba(111,207,151,0.2),inset_0_1px_2px_rgba(0,0,0,0.1)]",
        secondary:
          "bg-secondary border border-border/40 text-secondary-foreground hover:bg-secondary/80 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]",
        ghost:
          "hover:bg-secondary/60 hover:text-foreground active:bg-secondary/80",
        link:
          "text-primary underline-offset-4 hover:underline active:opacity-80",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-base font-semibold",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
