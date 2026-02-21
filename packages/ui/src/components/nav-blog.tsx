"use client";

import React, { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { cn } from "@sassy/ui/utils";

import { NavDropdown } from "./nav";
import type { DropdownItem } from "./nav/types";

// Re-export DropdownItem for consumers (backwards compatibility)
export type { DropdownItem };

// Mobile menu item type
interface MobileMenuItem {
  label: string;
  href: string;
}

// Default blog-specific mobile menu items
const defaultMobileMenuItems: MobileMenuItem[] = [
  { label: "Free Tools", href: "https://blog.engagekit.io/tag/tool" },
  { label: "Blogs", href: "https://blog.engagekit.io/tag/blog" },
];

// Mobile menu component with customizable items and CTA
function MobileMenu({
  isOpen,
  onClose,
  menuItems,
  ctaText,
  ctaHref,
  ctaOnClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MobileMenuItem[];
  ctaText: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}) {
  const [navHeight, setNavHeight] = useState(57);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  const handleCtaClick = () => {
    if (ctaOnClick) {
      ctaOnClick();
    } else if (ctaHref) {
      window.open(ctaHref, "_blank");
    }
  };

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
          {menuItems.map((item) => (
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
          <div className="mt-4 border-t-[1.5px] border-black pt-4">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleCtaClick}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default blog logo component
function DefaultBlogLogo() {
  return (
    <a
      href="https://blog.engagekit.io"
      target="_blank"
      rel="noopener noreferrer"
      className="mx-auto flex items-center gap-2 md:mx-0"
    >
      <img
        src="https://engagekit-ghost-blog.vercel.app/media/engagekit-logo.svg"
        alt="EngageKit"
        className="h-8 w-auto"
        style={{ border: "none" }}
      />
      <span className="text-lg font-bold">
        linkedin <span className="text-primary">hero</span> blog
      </span>
    </a>
  );
}

interface NavBlogProps {
  // Dropdown items
  blogItems?: DropdownItem[];
  blogItemsLoading?: boolean;
  toolItems?: DropdownItem[];
  toolItemsLoading?: boolean;
  // Customization props
  logo?: React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  mobileMenuItems?: MobileMenuItem[];
  showDropdowns?: boolean;
}

export function NavBlog({
  blogItems = [],
  blogItemsLoading,
  toolItems = [],
  toolItemsLoading,
  logo,
  ctaText = "Grow on LinkedIn",
  ctaHref,
  ctaOnClick,
  mobileMenuItems = defaultMobileMenuItems,
  showDropdowns = true,
}: NavBlogProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCtaClick = () => {
    if (ctaOnClick) {
      ctaOnClick();
    } else if (ctaHref) {
      window.open(ctaHref, "_blank");
    } else {
      window.location.href = "https://engagekit.io";
    }
  };

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 border-b-[1.5px] border-black bg-card px-0 py-4 shadow-[0_2px_0_#000] md:px-4 md:py-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          {/* Logo */}
          <div className="flex flex-1 items-center gap-3 md:flex-none">
            {logo ?? <DefaultBlogLogo />}
          </div>

          {/* Desktop: Dropdown menus - using new composable NavDropdown */}
          {showDropdowns && (
            <div className="hidden items-center gap-0 md:flex">
              <NavDropdown
                label="Free Tools"
                items={toolItems}
                isLoading={toolItemsLoading}
              />
              <NavDropdown
                label="Blog"
                items={blogItems}
                isLoading={blogItemsLoading}
              />
            </div>
          )}

          {/* Desktop: CTA Button */}
          <div className="hidden gap-2 md:flex">
            <Button
              variant="primary"
              onClick={handleCtaClick}
            >
              {ctaText}
            </Button>
          </div>

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

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={mobileMenuItems}
        ctaText={ctaText}
        ctaHref={ctaHref}
        ctaOnClick={ctaOnClick}
      />
    </>
  );
}
