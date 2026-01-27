import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  strokeWidth?: number;
  variant?: "default" | "success" | "accent";
  showValue?: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

const sizeConfig = {
  sm: { size: 48, stroke: 4, fontSize: "text-xs" },
  md: { size: 64, stroke: 5, fontSize: "text-sm" },
  lg: { size: 96, stroke: 6, fontSize: "text-lg" },
  xl: { size: 128, stroke: 8, fontSize: "text-2xl" },
};

const gradientIds = {
  default: "progress-gradient-default",
  success: "progress-gradient-success",
  accent: "progress-gradient-accent",
};

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      size = "md",
      strokeWidth,
      variant = "default",
      showValue = true,
      label,
      className,
      children,
    },
    ref
  ) => {
    const config = sizeConfig[size];
    const actualStroke = strokeWidth ?? config.stroke;
    const radius = (config.size - actualStroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const clampedValue = Math.min(100, Math.max(0, value));
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center",
          className
        )}
        style={{ width: config.size, height: config.size }}
      >
        <svg
          className="transform -rotate-90 transition-transform duration-300"
          width={config.size}
          height={config.size}
        >
          {/* Gradient definitions - LOCKED to Bisafit palette */}
          <defs>
            <linearGradient
              id={gradientIds.default}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="hsl(145 52% 55%)" />
              <stop offset="100%" stopColor="hsl(145 52% 65%)" />
            </linearGradient>
            <linearGradient
              id={gradientIds.success}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="hsl(145 52% 52%)" />
              <stop offset="100%" stopColor="hsl(145 52% 62%)" />
            </linearGradient>
            <linearGradient
              id={gradientIds.accent}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="hsl(42 70% 56%)" />
              <stop offset="100%" stopColor="hsl(42 75% 63%)" />
            </linearGradient>
          </defs>

          {/* Background circle - More subtle */}
          <circle
            className="text-secondary/30"
            strokeWidth={actualStroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={config.size / 2}
            cy={config.size / 2}
          />

          {/* Progress circle with gradient */}
          <circle
            className="transition-all duration-700 ease-out"
            strokeWidth={actualStroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={`url(#${gradientIds[variant]})`}
            fill="transparent"
            r={radius}
            cx={config.size / 2}
            cy={config.size / 2}
            style={{
              filter: clampedValue === 100 ? "drop-shadow(0 0 6px hsl(145 52% 55% / 0.5))" : undefined,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children ? (
            children
          ) : showValue ? (
            <>
              <span
                className={cn(
                  "font-bold tracking-tight text-foreground transition-all duration-300",
                  config.fontSize,
                  clampedValue === 100 && "text-primary"
                )}
              >
                {Math.round(clampedValue)}%
              </span>
              {label && (
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {label}
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  }
);

ProgressRing.displayName = "ProgressRing";

export { ProgressRing };
