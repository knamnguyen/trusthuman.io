"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../utils";

export interface AccordionTab {
  id: string | number;
  icon: LucideIcon;
  title: string;
  description?: string;
}

interface AccordionTabsProps {
  tabs: AccordionTab[];
  defaultActiveId?: string | number;
  onTabChange?: (id: string | number) => void;
  className?: string;
}

export function AccordionTabs({
  tabs,
  defaultActiveId,
  onTabChange,
  className,
}: AccordionTabsProps) {
  const [activeId, setActiveId] = useState(defaultActiveId ?? tabs[0]?.id);

  const handleTabHover = (id: string | number) => {
    setActiveId(id);
    onTabChange?.(id);
  };

  return (
    <div className={cn("flex h-40 gap-2", className)}>
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        const Icon = tab.icon;

        return (
          <div
            key={tab.id}
            onMouseEnter={() => handleTabHover(tab.id)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-500 ease-out",
              isActive
                ? "border-primary bg-primary/10 flex-[3]"
                : "border-transparent bg-muted/30 hover:bg-muted/50 flex-1"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Title - always visible */}
            <h3
              className={cn(
                "font-semibold transition-colors duration-300 whitespace-nowrap",
                isActive ? "text-primary" : "text-foreground"
              )}
            >
              {isActive ? tab.title : tab.title.split(" ").slice(0, 2).join(" ")}
            </h3>

            {/* Description - fades in/out without affecting height */}
            {tab.description && (
              <p
                className={cn(
                  "text-muted-foreground mt-1 text-sm transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              >
                {tab.description}
              </p>
            )}

            {/* Active indicator bar */}
            <div
              className={cn(
                "absolute bottom-0 left-1/2 h-1 -translate-x-1/2 rounded-full transition-all duration-300",
                isActive ? "bg-primary w-12" : "w-0"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
