import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "success" | "accent";
  }
>(({ className, value, variant = "default", ...props }, ref) => {
  const indicatorVariants = {
    default: "bg-gradient-to-r from-[hsl(145_52%_55%)] to-[hsl(145_52%_65%)]",
    success: "bg-gradient-to-r from-[hsl(145_52%_50%)] to-[hsl(145_60%_60%)]",
    accent: "bg-gradient-to-r from-[hsl(42_70%_55%)] to-[hsl(42_75%_63%)]",
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary/60",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 rounded-full transition-all duration-500 ease-out",
          indicatorVariants[variant]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
