import { useEffect, useState } from "react";

import { Sheet } from "@sassy/ui/sheet";

import { ToggleButton } from "./_components/ToggleButton";
import { ButtonPortalManager } from "./engage-button/ButtonPortalManager";
import { LinkedInSidebar } from "./LinkedInSidebar";
import { SaveProfilePortalManager } from "./save-profile";
import { useShadowRootStore, useSidebarStore } from "./stores";

interface AppProps {
  shadowRoot: HTMLElement;
}

export default function App({ shadowRoot }: AppProps) {
  // Sidebar state from Zustand store (allows EngageButton to open it)
  const { isOpen, setIsOpen } = useSidebarStore();
  const setShadowRoot = useShadowRootStore((s) => s.setShadowRoot);
  const [showOpenButton, setShowOpenButton] = useState(true);

  // Set shadow root in store for Radix portals (popover, dialog, etc.)
  useEffect(() => {
    setShadowRoot(shadowRoot);
  }, [shadowRoot, setShadowRoot]);

  // Handle first install: auto-open sidebar
  useEffect(() => {
    chrome.storage.local.get(["hasOpenedSidebar"], (result) => {
      if (!result.hasOpenedSidebar) {
        // First install - auto-open sidebar
        console.log(
          "EngageKit WXT: First install detected, auto-opening sidebar",
        );
        setIsOpen(true);
        chrome.storage.local.set({ hasOpenedSidebar: true });
      }
    });
  }, [setIsOpen]);

  // Handle button visibility with animation delay
  useEffect(() => {
    if (isOpen) {
      // Hide open button immediately when opening
      setShowOpenButton(false);
    } else {
      // Show open button after close animation completes (300ms)
      const timer = setTimeout(() => {
        setShowOpenButton(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      {/* Open button - only visible when sidebar is closed and animation finished */}
      {showOpenButton && (
        <div className="fixed top-1/2 right-0 z-[9999] -translate-y-1/2">
          <ToggleButton isOpen={false} onToggle={() => setIsOpen(true)} />
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <LinkedInSidebar onClose={() => setIsOpen(false)} />
      </Sheet>

      {/* Single React tree manages all injected engage buttons */}
      <ButtonPortalManager />

      {/* Single React tree manages all injected save profile buttons */}
      <SaveProfilePortalManager />
    </>
  );
}
