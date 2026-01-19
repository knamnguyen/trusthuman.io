"use client";

import { cn } from "../../utils";

interface TourProgressProps {
  current: number;
  total: number;
  onDotClick?: (index: number) => void;
  size?: "sm" | "md";
}

export function TourProgress({
  current,
  total,
  onDotClick,
  size = "md",
}: TourProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          disabled={!onDotClick}
          className={cn(
            "rounded-full transition-all",
            size === "sm" ? "h-1.5" : "h-2",
            index === current
              ? cn("bg-neutral-900", size === "sm" ? "w-5" : "w-6")
              : cn(
                  "bg-neutral-300 hover:bg-neutral-400",
                  size === "sm" ? "w-1.5" : "w-2",
                ),
            onDotClick && "cursor-pointer",
          )}
        />
      ))}
    </div>
  );
}
