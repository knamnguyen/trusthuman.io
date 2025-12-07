import { useEffect, useState } from "react";

import { Sheet } from "@sassy/ui/sheet";

import { LinkedInSidebar } from "./LinkedInSidebar";
import { ToggleButton } from "./ToggleButton";

interface AppProps {
  portalContainer: HTMLElement;
}

export default function App({ portalContainer }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOpenButton, setShowOpenButton] = useState(true);

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
    </>
  );
}
