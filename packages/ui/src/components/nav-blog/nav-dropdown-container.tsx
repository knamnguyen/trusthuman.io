"use client";

/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState } from "react";

import { cn } from "@sassy/ui/utils";

export interface DropdownItem {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconEmoji?: string; // Fallback emoji if no icon component
  href: string;
  description: string;
  previewImage?: string; // Image URL for preview
}

interface NavDropdownContainerProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  renderPreview?: (item: DropdownItem | null) => React.ReactNode; // Optional - uses default if not provided
  children?: React.ReactNode; // Optional fallback for custom content
}

// Unified preview component used by default
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
            "bg-white",
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
          "bg-white",
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

export function NavDropdownContainer({
  trigger,
  items,
  renderPreview,
  children,
}: NavDropdownContainerProps) {
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
    // Find the parent nav-blog's nav element
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
      setHoveredItem(null); // Reset hover state when closing
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

  // Measure parent nav-blog's nav height for dropdown positioning
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

  return (
    <>
      <div
        ref={triggerRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {React.isValidElement(trigger)
          ? React.cloneElement(
              trigger as React.ReactElement<{ isOpen?: boolean }>,
              { isOpen },
            )
          : trigger}
      </div>

      {/* Full-width dropdown - positioned outside nav to avoid overflow */}
      {/* Hidden on mobile - mobile uses hamburger menu instead */}
      {isOpen && (
        <div
          ref={menuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "fixed right-0 left-0 z-[100] hidden md:block",
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
            {children ? (
              children
            ) : (
              <div className="flex gap-6">
                {/* Left side - Tool list */}
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
                            "bg-white text-black no-underline",
                            "hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000]",
                            "transition-all duration-150",
                            "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
                            isHovered && "bg-gray-50",
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
      )}
    </>
  );
}
