import { useEffect, useState } from "react";

import { Sheet } from "@sassy/ui/sheet";

import { ButtonPortalManager } from "./ButtonPortalManager";
import { LinkedInSidebar } from "./LinkedInSidebar";
import { ToggleButton } from "./ToggleButton";

interface AppProps {
  portalContainer: HTMLElement;
}

export default function App({ portalContainer }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOpenButton, setShowOpenButton] = useState(true);

  // Handle first install: auto-open sidebar
  useEffect(() => {
    chrome.storage.local.get(["hasOpenedSidebar"], (result) => {
      if (!result.hasOpenedSidebar) {
        // First install - auto-open sidebar
        console.log("EngageKit WXT: First install detected, auto-opening sidebar");
        setIsOpen(true);
        chrome.storage.local.set({ hasOpenedSidebar: true });
      }
    });
  }, []);

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
        <div className="fixed top-1/2 right-0 -translate-y-1/2 z-[9999]">
          <ToggleButton isOpen={false} onToggle={() => setIsOpen(true)} />
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <LinkedInSidebar
          portalContainer={portalContainer}
          onClose={() => setIsOpen(false)}
        />
      </Sheet>

      {/* Single React tree manages all injected engage buttons */}
      <ButtonPortalManager />
    </>
  );
}
