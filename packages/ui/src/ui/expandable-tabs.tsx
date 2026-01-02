"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

import { cn } from "../utils";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  /** Controlled value - the active tab index */
  value?: number;
  /** Default tab index (uncontrolled mode) */
  defaultValue?: number;
  /** Called when the active tab changes - always passes a number */
  onChange?: (index: number) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = {
  delay: 0.1,
  type: "spring" as const,
  bounce: 0,
  duration: 0.6,
};

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  value,
  defaultValue = 0,
  onChange,
}: ExpandableTabsProps) {
  // Support both controlled (value prop) and uncontrolled (internal state) modes
  const [internalSelected, setInternalSelected] = React.useState(defaultValue);
  const selected = value !== undefined ? value : internalSelected;

  const handleSelect = (index: number) => {
    if (value === undefined) {
      setInternalSelected(index);
    }
    onChange?.(index);
  };

  const Separator = () => (
    <div className="bg-border mx-1 h-[24px] w-[1.2px]" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "bg-background flex flex-wrap items-center gap-2 rounded-2xl border p-1 shadow-sm",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              selected === index
                ? cn("bg-muted", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon size={20} />
            <AnimatePresence initial={false}>
              {selected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
