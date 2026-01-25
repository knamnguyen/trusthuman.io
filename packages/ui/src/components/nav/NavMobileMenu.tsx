"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@sassy/ui/utils";

import type { NavMobileMenuProps } from "./types";

export function NavMobileMenu({
  isOpen,
  onClose,
  items,
  cta,
}: NavMobileMenuProps) {
  const [navHeight, setNavHeight] = useState(57);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.querySelector("nav");
      if (nav) {
        const rect = nav.getBoundingClientRect();
        setNavHeight(rect.bottom);
      }
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => window.removeEventListener("resize", updateNavHeight);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const hamburgerButton = document.querySelector(
          '[aria-label="Toggle menu"]',
        );
        if (
          hamburgerButton &&
          !hamburgerButton.contains(event.target as Node)
        ) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed right-0 left-0 z-[100]",
        "border-[1.5px] border-black bg-card shadow-[4px_4px_0_#000]",
        "rounded-t-none rounded-b-sm",
        "animate-[slideDown_0.2s_ease-out]",
      )}
      style={{
        width: "100vw",
        maxWidth: "100vw",
        top: `${navHeight}px`,
      }}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-4 py-4",
                "border-[1.5px] border-black shadow-[2px_2px_0_#000]",
                "bg-card text-black no-underline",
                "hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000]",
                "transition-all duration-150",
                "text-left",
              )}
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            </a>
          ))}
          {cta && (
            <div className="mt-4 border-t-[1.5px] border-black pt-4">{cta}</div>
          )}
        </div>
      </div>
    </div>
  );
}
