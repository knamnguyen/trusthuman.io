"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

import { cn } from "@sassy/ui/utils";

import type { NavBarProps } from "./types";

export function NavBar({ logo, cta, children, className }: NavBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50",
        "border-b-[1.5px] border-black bg-card shadow-[0_2px_0_#000]",
        "px-0 py-4 md:px-4 md:py-4",
        className,
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo - centered on mobile, left on desktop */}
        <div className="flex flex-1 items-center gap-3 md:flex-none">
          {logo}
        </div>

        {/* Desktop: Dropdown menus */}
        <div className="hidden items-center gap-0 md:flex">{children}</div>

        {/* Desktop: CTA Button */}
        {cta && <div className="hidden gap-2 md:flex">{cta}</div>}

        {/* Mobile: Hamburger menu */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="-mr-2 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
    </nav>
  );
}

// Export hook for mobile menu state (for consumers who need custom mobile menus)
export function useNavMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
