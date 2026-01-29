import * as React from "react";
import { cn } from "@/lib/utils";

export interface ImageOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  overlay?: "default" | "dark" | "subtle" | "vignette" | "none";
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const overlayClasses = {
  default: "after:absolute after:inset-0 after:bg-gradient-to-b after:from-[rgba(14,17,22,0.1)] after:to-[rgba(14,17,22,0.4)]",
  dark: "after:absolute after:inset-0 after:bg-gradient-to-b after:from-[rgba(14,17,22,0.2)] after:to-[rgba(14,17,22,0.6)]",
  subtle: "after:absolute after:inset-0 after:bg-gradient-to-b after:from-[rgba(14,17,22,0.05)] after:to-[rgba(14,17,22,0.25)]",
  vignette: "after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(14,17,22,0.4)_100%)]",
  none: "",
};

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  auto: "",
};

const roundedClasses = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[20px]",
  "2xl": "rounded-[24px]",
  full: "rounded-full",
};

const ImageOverlay = React.forwardRef<HTMLDivElement, ImageOverlayProps>(
  (
    {
      src,
      alt,
      overlay = "default",
      aspectRatio = "auto",
      rounded = "xl",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          aspectRatioClasses[aspectRatio],
          roundedClasses[rounded],
          overlayClasses[overlay],
          "after:pointer-events-none",
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {children && (
          <div className="absolute inset-0 z-10 flex items-end p-4">
            {children}
          </div>
        )}
      </div>
    );
  }
);

ImageOverlay.displayName = "ImageOverlay";

export { ImageOverlay };
