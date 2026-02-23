"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Themed Toaster for Next.js apps (uses next-themes).
 * For shadow root/extension usage, use ToasterSimple instead.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

interface ToasterSimpleProps {
  /** Container element for portal rendering (e.g., shadow root) */
  container?: HTMLElement | null;
  /** Toast position */
  position?: ToasterProps["position"];
}

/**
 * Copy sonner styles from document head into the shadow root.
 * Sonner injects styles into document.head which aren't available in shadow DOM.
 */
function copySonnerStylesToShadow(shadowContainer: HTMLElement | null | undefined) {
  if (!shadowContainer) return;

  // Find the shadow root
  const shadowRoot = shadowContainer.getRootNode();
  if (!(shadowRoot instanceof ShadowRoot)) return;

  // Check if we already copied styles
  if (shadowRoot.querySelector("[data-sonner-styles]")) return;

  // Find and copy sonner styles from document head
  document.head.querySelectorAll("style").forEach((styleEl) => {
    if (styleEl.textContent?.includes("[data-sonner-toaster]")) {
      const clonedStyle = styleEl.cloneNode(true) as HTMLStyleElement;
      clonedStyle.setAttribute("data-sonner-styles", "true");
      shadowRoot.appendChild(clonedStyle);
    }
  });
}

/**
 * Simple Toaster without next-themes dependency.
 * Accepts a container prop for shadow root support in extensions.
 */
const ToasterSimple = ({
  container,
  position = "bottom-right",
}: ToasterSimpleProps) => {
  // Copy sonner styles into shadow root on mount
  useEffect(() => {
    // Small delay to ensure sonner has injected its styles
    const timer = setTimeout(() => {
      copySonnerStylesToShadow(container);
    }, 100);
    return () => clearTimeout(timer);
  }, [container]);

  return (
    <Sonner
      theme="light"
      position={position}
      // @ts-expect-error - sonner accepts HTMLElement but types expect ShadowRoot
      container={container}
      toastOptions={{
        style: {
          // Ensure toast is visible above host page UI
          zIndex: 999999,
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "!bg-red-50 !border-red-200 !text-red-900",
          success: "!bg-green-50 !border-green-200 !text-green-900",
        },
      }}
    />
  );
};

export { Toaster, ToasterSimple, toast };
