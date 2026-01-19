"use client";

import { useEffect, useId, useState } from "react";

import { queryElement } from "./utils/query-element";

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TourOverlayProps {
  selector: string | string[]; // Single selector or array for multi-highlight
  onOverlayClick?: () => void;
  className?: string;
  padding?: number;
  borderRadius?: number;
  /** Shadow root to search within (for extension shadow DOM) */
  shadowRoot?: Element | DocumentFragment | null;
  /** Allow clicks to pass through to highlighted elements (default: false) */
  allowInteraction?: boolean;
}

export function TourOverlay({
  selector,
  onOverlayClick,
  className,
  padding = 8,
  borderRadius = 8,
  shadowRoot,
  allowInteraction = false,
}: TourOverlayProps) {
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const maskId = useId();

  useEffect(() => {
    // Normalize to array
    const selectors = Array.isArray(selector) ? selector : [selector];
    // Track found elements by selector
    let elementMap = new Map<string, Element>();

    const updateHighlights = () => {
      const rects: HighlightRect[] = [];
      for (const el of elementMap.values()) {
        const rect = el.getBoundingClientRect();
        rects.push({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }

      setHighlights(rects);
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set up ResizeObserver to watch for size changes (e.g., tab animations)
    const resizeObserver = new ResizeObserver(() => {
      updateHighlights();
    });

    // Function to find all elements for this step
    const findElements = () => {
      // Clear previous elements and re-query all selectors
      resizeObserver.disconnect();
      elementMap = new Map<string, Element>();

      for (const sel of selectors) {
        const element = queryElement(sel, shadowRoot);
        if (element) {
          elementMap.set(sel, element);
          resizeObserver.observe(element);
        }
      }
      updateHighlights();
    };

    // Initial search immediately
    findElements();

    // Also search again after a short delay to catch elements rendered by onBeforeStep
    // (e.g., tab content that appears after clicking a tab)
    const delayedSearchTimeout = setTimeout(() => {
      findElements();
    }, 150);

    window.addEventListener("resize", updateHighlights);
    window.addEventListener("scroll", updateHighlights, true);

    return () => {
      clearTimeout(delayedSearchTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHighlights);
      window.removeEventListener("scroll", updateHighlights, true);
    };
  }, [selector, shadowRoot]);

  if (highlights.length === 0) return null;

  // Use inline styles since this component renders to document.body (outside Tailwind scope)
  return (
    <svg
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99998,
        pointerEvents: "none",
      }}
      width={viewport.width}
      height={viewport.height}
    >
      <defs>
        <mask id={maskId}>
          {/* White = visible overlay, Black = transparent (spotlight) */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* Cut out each highlighted element */}
          {highlights.map((rect, index) => (
            <rect
              key={index}
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx={borderRadius}
              fill="black"
            />
          ))}
        </mask>
      </defs>

      {/* Darkened overlay with cutouts */}
      <rect
        width="100%"
        height="100%"
        mask={`url(#${maskId})`}
        fill="rgba(0, 0, 0, 0.8)"
      />

      {/* Clickable overlay area (outside spotlights) */}
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        style={{ pointerEvents: "auto", cursor: "pointer" }}
        onClick={onOverlayClick}
      />

      {/* Transparent blocking areas over spotlights - only when interaction is disabled */}
      {!allowInteraction &&
        highlights.map((rect, index) => (
          <rect
            key={`block-${index}`}
            x={rect.left - padding}
            y={rect.top - padding}
            width={rect.width + padding * 2}
            height={rect.height + padding * 2}
            rx={borderRadius}
            fill="transparent"
            style={{ pointerEvents: "auto" }}
          />
        ))}

      {/* Spotlight borders */}
      {highlights.map((rect, index) => (
        <rect
          key={`border-${index}`}
          x={rect.left - padding}
          y={rect.top - padding}
          width={rect.width + padding * 2}
          height={rect.height + padding * 2}
          rx={borderRadius}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
