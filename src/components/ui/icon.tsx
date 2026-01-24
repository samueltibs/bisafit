import * as React from "react";
import { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "muted" | "accent" | "subtle";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

const strokeWidths = {
  sm: 2,
  md: 1.75,
  lg: 1.5,
  xl: 1.25,
};

const variantClasses = {
  default: "text-foreground",
  primary: "text-primary",
  muted: "text-muted-foreground",
  accent: "text-accent",
  subtle: "text-foreground/60",
};

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size = "md", variant = "default", className, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          "transition-colors duration-200",
          className
        )}
        strokeWidth={props.strokeWidth ?? strokeWidths[size]}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";

export { Icon };
