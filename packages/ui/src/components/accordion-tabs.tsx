"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
          <motion.div
            key={tab.id}
            onMouseEnter={() => handleTabHover(tab.id)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-xl border p-4",
              isActive
                ? "border-primary bg-primary/10"
                : "border-transparent bg-muted/30 hover:bg-muted/50"
            )}
            animate={{
              flex: isActive ? 3 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Icon */}
            <motion.div
              className={cn(
                "mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
              )}
              animate={{
                backgroundColor: isActive ? "var(--primary)" : "var(--muted)",
              }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>

            {/* Title - always visible */}
            <motion.h3
              className={cn(
                "font-semibold whitespace-nowrap",
                isActive ? "text-primary" : "text-foreground"
              )}
              animate={{
                color: isActive ? "var(--primary)" : "var(--foreground)",
              }}
              transition={{ duration: 0.2 }}
            >
              {isActive ? tab.title : tab.title.split(" ").slice(0, 2).join(" ")}
            </motion.h3>

            {/* Description - fades in/out */}
            {tab.description && (
              <motion.p
                className="text-muted-foreground mt-1 text-sm"
                animate={{
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                {tab.description}
              </motion.p>
            )}

            {/* Active indicator bar */}
            <motion.div
              className="bg-primary absolute bottom-0 left-1/2 h-1 rounded-full"
              animate={{
                width: isActive ? 48 : 0,
                x: "-50%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
