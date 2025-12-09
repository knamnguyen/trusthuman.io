"use client";

import React, { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { cn } from "@sassy/ui/utils";

import type { DropdownItem } from "./nav-blog/blog-dropdown";
import { BLOG_LABEL, BlogDropdown } from "./nav-blog/blog-dropdown";
// Import dropdown data and components
import {
  alternativesData,
  caseStudiesData,
  expertGuideData,
  freeToolsData,
  growthDirectoriesData,
} from "./nav-blog/dropdown-data";
import { NavDropdownContainer } from "./nav-blog/nav-dropdown-container";

// Re-export DropdownItem for consumers
export type { DropdownItem };

function DropdownTrigger({
  isOpen,
  label,
}: {
  isOpen?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 items-center gap-2 px-4 text-sm font-semibold text-black",
        "rounded-none border-0 bg-transparent shadow-none",
        "no-underline",
        "focus-visible:outline-none",
        "transition-all duration-150",
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

// Mobile menu items with their tag mappings (single word tags only)
const mobileMenuItems = [
  { label: "Free Tools", tag: "tool" },
  { label: "Blogs", tag: "blog" },
  { label: "Growth Directories", tag: "directory" },
  { label: "Case Studies", tag: "case" },
  { label: "Expert Guide", tag: "guide" },
  { label: "Alternatives", tag: "alternative" },
];

function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
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

  // Close menu when clicking outside
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

  const handleItemClick = (tag: string) => {
    window.location.href = `https://blog.engagekit.io/tag/${tag}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className={cn(
          "fixed right-0 left-0 z-[100]",
          "border-[1.5px] border-black bg-white shadow-[4px_4px_0_#000]",
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
            {mobileMenuItems.map((item) => (
              <button
                key={item.tag}
                onClick={() => handleItemClick(item.tag)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-4 py-4",
                  "border-[1.5px] border-black shadow-[2px_2px_0_#000]",
                  "bg-white text-black",
                  "hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000]",
                  "transition-all duration-150",
                  "text-left",
                )}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </button>
            ))}
            <div className="mt-4 border-t-[1.5px] border-black pt-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => (window.location.href = "https://engagekit.io")}
              >
                Grow on LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface NavBlogProps {
  blogItems?: DropdownItem[];
  blogItemsLoading?: boolean;
}

export function NavBlog({ blogItems, blogItemsLoading }: NavBlogProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 border-b-[1.5px] border-black bg-white px-0 py-4 shadow-[0_2px_0_#000] md:px-4 md:py-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          {/* Desktop: Logo on left, Desktop: Logo centered on mobile */}
          <div className="flex flex-1 items-center gap-3 md:flex-none">
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
                linkedin <span style={{ color: "#e5486c" }}>hero</span> blog
              </span>
            </a>
          </div>

          {/* Desktop: Dropdown menus */}
          <div className="hidden items-center gap-0 md:flex">
            <NavDropdownContainer
              trigger={<DropdownTrigger label="Free Tools" />}
              items={freeToolsData}
            />
            <BlogDropdown
              trigger={<DropdownTrigger label={BLOG_LABEL} />}
              items={blogItems}
              isLoading={blogItemsLoading}
            />
            {/* <NavDropdownContainer
              trigger={<DropdownTrigger label="Growth Directories" />}
              items={growthDirectoriesData}
            />
            <NavDropdownContainer
              trigger={<DropdownTrigger label="Case Studies" />}
              items={caseStudiesData}
            />
            <NavDropdownContainer
              trigger={<DropdownTrigger label="Expert Guide" />}
              items={expertGuideData}
            />
            <NavDropdownContainer
              trigger={<DropdownTrigger label="Alternatives" />}
              items={alternativesData}
            /> */}
          </div>

          {/* Desktop: CTA Button */}
          <div className="hidden gap-2 md:flex">
            <Button
              variant="primary"
              onClick={() => (window.location.href = "https://engagekit.io")}
            >
              Grow on LinkedIn
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

      {/* Mobile Menu Dropdown */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
