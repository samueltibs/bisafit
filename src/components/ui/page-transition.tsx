import * as React from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-page-enter",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PageTransition.displayName = "PageTransition";

export { PageTransition };
