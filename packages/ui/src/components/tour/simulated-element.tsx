"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GhostCursor, injectGhostCursorStyles } from "./ghost-cursor";
import { queryElement } from "./utils/query-element";

interface SimulatedElementProps {
  selector: string;
  shadowRoot?: Element | DocumentFragment | null;
  /** Show ghost cursor animation when clicking */
  animated?: boolean;
}

/**
 * Get all computed styles for an element and its descendants
 */
function getComputedStylesInline(element: Element): string {
  const computed = window.getComputedStyle(element);
  const styles: string[] = [];

  // Copy all computed style properties
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (prop) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        styles.push(`${prop}: ${value}`);
      }
    }
  }

  return styles.join("; ");
}

/**
 * Deep clone an element with inlined computed styles.
 * Also adds data-clone-index attributes to map clone descendants to originals.
 */
function cloneWithStyles(element: Element): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Inline styles on the root element
  clone.style.cssText = getComputedStylesInline(element);
  clone.setAttribute("data-clone-index", "root");

  // Inline styles on all descendants and add index mapping
  const originalDescendants = element.querySelectorAll("*");
  const clonedDescendants = clone.querySelectorAll("*");

  originalDescendants.forEach((orig, i) => {
    const cloned = clonedDescendants[i] as HTMLElement | undefined;
    if (cloned && cloned.style) {
      cloned.style.cssText = getComputedStylesInline(orig);
      // Add index so we can find the corresponding original element on click
      cloned.setAttribute("data-clone-index", String(i));
    }
  });

  return clone;
}

/**
 * SimulatedElement renders a clone of a DOM element with inlined styles.
 * Interactions (click, input, etc.) are proxied back to the original element.
 *
 * Uses MutationObserver to detect when the element appears in the DOM
 * (handles async rendering from onBeforeStep tab switches).
 */
export function SimulatedElement({
  selector,
  shadowRoot,
  animated = false,
}: SimulatedElementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [originalElement, setOriginalElement] = useState<Element | null>(null);
  const originalElementRef = useRef<Element | null>(null);
  const animatedRef = useRef(animated);
  const selectorRef = useRef(selector);
  const shadowRootRef = useRef(shadowRoot);

  // Ghost cursor animation state
  const [ghostCursor, setGhostCursor] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    pendingClick: () => void;
  } | null>(null);

  // Keep refs in sync
  useEffect(() => {
    animatedRef.current = animated;
    if (animated) {
      injectGhostCursorStyles();
    }
  }, [animated]);

  useEffect(() => {
    selectorRef.current = selector;
  }, [selector]);

  useEffect(() => {
    shadowRootRef.current = shadowRoot;
  }, [shadowRoot]);

  useEffect(() => {
    originalElementRef.current = originalElement;
  }, [originalElement]);

  // Render clone to container
  const renderClone = useCallback((element: Element) => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = "";

    // Clone with inlined styles
    const clone = cloneWithStyles(element);

    // Remove any IDs to avoid duplicates
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

    // Add data attribute to identify as simulated
    clone.setAttribute("data-simulated", "true");

    container.appendChild(clone);

    // Set up event proxying - find corresponding original element by index
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      // Re-query the element in case it was re-rendered (especially for LinkedIn-injected elements)
      let origEl = originalElementRef.current;

      if (!origEl || !origEl.isConnected) {
        // Element was removed from DOM, try to find it again
        origEl = queryElement(selectorRef.current, shadowRootRef.current);
        if (origEl) {
          originalElementRef.current = origEl;
        }
      }
      if (!origEl) return;

      // Find the clicked element or its closest parent with a clone index
      const clickedClone = (e.target as HTMLElement).closest("[data-clone-index]");
      if (!clickedClone) {
        // Fallback: click the root element
        if (origEl instanceof HTMLElement) {
          origEl.click();
        }
        return;
      }

      const cloneIndex = clickedClone.getAttribute("data-clone-index");
      let targetElement: HTMLElement | null = null;

      if (cloneIndex === "root") {
        // Clicked the root element
        if (origEl instanceof HTMLElement) {
          targetElement = origEl;
        }
      } else {
        // Find the corresponding original descendant by index
        const originalDescendants = origEl.querySelectorAll("*");
        const index = parseInt(cloneIndex ?? "", 10);
        const correspondingOriginal = originalDescendants[index];

        if (correspondingOriginal) {
          // Check if this element is interactive (button, a, input, etc.)
          // If not, find the closest interactive parent
          const interactiveTags = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"];
          if (interactiveTags.includes(correspondingOriginal.tagName)) {
            targetElement = correspondingOriginal as HTMLElement;
          } else {
            // Find closest interactive parent (works for both HTMLElement and SVGElement)
            const interactiveParent = correspondingOriginal.closest(
              "button, a, input, select, textarea, [role='button'], [tabindex]"
            );
            if (interactiveParent instanceof HTMLElement) {
              targetElement = interactiveParent;
            } else {
              // Fallback to root element
              if (origEl instanceof HTMLElement) {
                targetElement = origEl;
              }
            }
          }
        }
      }

      if (targetElement) {
        const performClick = () => {
          // Focus the element first (some components need this)
          targetElement!.focus();
          // Use simple .click() - works for most elements including Radix UI
          targetElement!.click();
        };

        if (animatedRef.current) {
          // Get positions for ghost cursor animation
          const clickedRect = (clickedClone as HTMLElement).getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();

          setGhostCursor({
            from: {
              x: clickedRect.left + clickedRect.width / 2,
              y: clickedRect.top + clickedRect.height / 2,
            },
            to: {
              x: targetRect.left + targetRect.width / 2,
              y: targetRect.top + targetRect.height / 2,
            },
            pendingClick: performClick,
          });
        } else {
          performClick();
        }
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const origEl = originalElementRef.current;
      if (!target || !origEl) return;

      // Find corresponding input in original
      if (origEl instanceof HTMLInputElement) {
        origEl.value = target.value;
        origEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    clone.addEventListener("click", handleClick);
    clone.addEventListener("input", handleInput);

    return () => {
      clone.removeEventListener("click", handleClick);
      clone.removeEventListener("input", handleInput);
    };
  }, []);

  // Find element using MutationObserver for async elements
  useEffect(() => {
    // Try immediately first
    const element = queryElement(selector, shadowRoot);
    if (element) {
      setOriginalElement(element);
      renderClone(element);
      return;
    }

    // Element not found - watch for it to appear
    const observerTargets: (Element | Document)[] = [];
    if (shadowRoot instanceof Element) {
      observerTargets.push(shadowRoot);
    }
    observerTargets.push(document.body);

    const observer = new MutationObserver(() => {
      const el = queryElement(selector, shadowRoot);
      if (el) {
        setOriginalElement(el);
        renderClone(el);
        observer.disconnect();
      }
    });

    // Observe both shadow root (if available) and document body
    for (const target of observerTargets) {
      observer.observe(target, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [selector, shadowRoot, renderClone]);

  // Watch for changes in the original element (for re-rendering clone)
  useEffect(() => {
    if (!originalElement) return;

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver(() => {
      // Debounce to batch rapid mutations and let React state settle
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        renderClone(originalElement);
      }, 50);
    });

    observer.observe(originalElement, {
      attributes: true,
      attributeFilter: ["data-state", "aria-selected", "class", "style"],
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      observer.disconnect();
    };
  }, [originalElement, renderClone]);

  const handleGhostCursorComplete = useCallback(() => {
    if (ghostCursor) {
      ghostCursor.pendingClick();
      setGhostCursor(null);
    }
  }, [ghostCursor]);

  return (
    <>
      <div
        ref={containerRef}
        className="simulated-element-container inline-flex items-center justify-center"
        style={{ cursor: "pointer" }}
      />
      {ghostCursor && (
        <GhostCursor
          from={ghostCursor.from}
          to={ghostCursor.to}
          onComplete={handleGhostCursorComplete}
        />
      )}
    </>
  );
}
