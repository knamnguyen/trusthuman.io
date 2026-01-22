"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@sassy/ui/utils";

import type { NavTriggerProps } from "./types";

export function NavTrigger({ isOpen, label, className }: NavTriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 items-center gap-2 px-4 text-sm font-semibold text-black",
        "rounded-none border-0 bg-transparent shadow-none",
        "no-underline",
        "focus-visible:outline-none",
        "transition-all duration-150",
        className,
      )}
      style={{
        textDecoration: "none",
        borderBottom: "none",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
      }}
    >
      <span>{label}</span>
      <ChevronDown
        className={cn(
          "h-3 w-3 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
}
