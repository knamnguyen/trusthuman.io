"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "@sassy/ui/utils";

import { NavTrigger } from "./NavTrigger";
import type { DropdownItem, NavDropdownProps } from "./types";

// Default preview component when hovering over items
function DefaultPreview({ item }: { item: DropdownItem | null }) {
  if (!item) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Hover over an item to see preview
          </p>
        </div>
      </div>
    );
  }

  const Icon = item.icon;

  return (
    <div className="flex h-full flex-col px-6">
      <div className="mb-4 flex flex-shrink-0 items-center gap-3">
        <div
          className={cn(
            "rounded-sm p-3",
            "border-[1.5px] border-black shadow-[2px_2px_0_#000]",
            "bg-card",
          )}
        >
          {Icon ? (
            <Icon className="h-6 w-6" />
          ) : (
            <span className="text-2xl">{item.iconEmoji || "📄"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {item.description}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex-1 overflow-hidden",
          "border-[1.5px] border-black shadow-[2px_2px_0_#000]",
          "bg-card",
        )}
      >
        {item.previewImage ? (
          <img
            src={item.previewImage}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-muted-foreground text-center text-sm">
              No preview image available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function NavDropdown({
  label,
  items,
  isLoading,
  renderPreview,
  children,
}: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<DropdownItem | null>(null);
  const [navHeight, setNavHeight] = useState(57);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Find the parent nav element
    if (triggerRef.current) {
      const parentNav = triggerRef.current.closest("nav");
      if (parentNav) {
        const rect = parentNav.getBoundingClientRect();
        setNavHeight(rect.bottom);
      }
    }
    setIsOpen(true);
    // Set first item as default preview when opening
    if (items.length > 0 && !hoveredItem) {
      setHoveredItem(items[0] || null);
    }
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredItem(null);
    }, 150);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Measure parent nav height for dropdown positioning
  useEffect(() => {
    const updateNavHeight = () => {
      if (triggerRef.current) {
        const parentNav = triggerRef.current.closest("nav");
        if (parentNav) {
          const rect = parentNav.getBoundingClientRect();
          setNavHeight(rect.bottom);
        }
      }
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    window.addEventListener("scroll", updateNavHeight);

    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("scroll", updateNavHeight);
    };
  }, []);

  // Set first item as default preview when dropdown opens
  useEffect(() => {
    if (isOpen && items.length > 0 && !hoveredItem) {
      setHoveredItem(items[0] || null);
    }
  }, [isOpen, items, hoveredItem]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative">
        <NavTrigger label={label} />
      </div>
    );
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <NavTrigger label={label} isOpen={isOpen} />
      </div>

      {/* Full-width dropdown - positioned outside nav to avoid overflow */}
      {/* Hidden on mobile - mobile uses hamburger menu instead */}
      {isOpen && (
        <>
          {/* Inject keyframes for clip-path animation */}
          <style>{`
            @keyframes navDropdownSlideDown {
              from {
                opacity: 0;
                clip-path: inset(0 0 100% 0);
              }
              to {
                opacity: 1;
                clip-path: inset(0 0 0% 0);
              }
            }
          `}</style>
          <div
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "fixed right-0 left-0 z-[100] hidden md:block",
              "border-[1.5px] border-black bg-background shadow-[4px_4px_0_#000]",
              "rounded-t-none rounded-b-sm",
            )}
            style={{
              width: "100vw",
              maxWidth: "100vw",
              top: `${navHeight}px`,
              animation: "navDropdownSlideDown 0.25s ease-out forwards",
            }}
          >
            <div className="container mx-auto px-4 py-6">
              {children ? (
                children
              ) : (
                <div className="flex gap-6">
                  {/* Left side - Item list */}
                  <div className="w-1/2 flex-shrink-0">
                    <div
                      className={cn(
                        "grid grid-cols-2 gap-2",
                        items.length > 8 && "max-h-[400px] overflow-y-auto pr-2",
                      )}
                    >
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isHovered = hoveredItem?.id === item.id;
                        return (
                          <a
                            key={item.id}
                            href={item.href}
                            onMouseEnter={() => setHoveredItem(item)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={cn(
                              "flex items-center gap-3 rounded-sm px-4 py-7",
                              "border-[1.5px] border-black shadow-[2px_2px_0_#000]",
                              "bg-card text-black no-underline",
                              "hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000]",
                              "transition-all duration-150",
                              "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
                              isHovered && "bg-accent",
                            )}
                          >
                            {Icon ? (
                              <Icon className="h-5 w-5 flex-shrink-0" />
                            ) : (
                              <span className="flex-shrink-0 text-lg">
                                {item.iconEmoji || "📄"}
                              </span>
                            )}
                            <div className="flex min-w-0 flex-col">
                              <span className="text-sm font-semibold">
                                {item.title}
                              </span>
                              {item.description && (
                                <span className="text-muted-foreground truncate text-xs">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side - Preview component */}
                  <div className="min-w-0 flex-1">
                    <div className="relative h-[400px]">
                      <div className="absolute inset-0 overflow-auto">
                        {renderPreview ? (
                          renderPreview(hoveredItem)
                        ) : (
                          <DefaultPreview item={hoveredItem} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
