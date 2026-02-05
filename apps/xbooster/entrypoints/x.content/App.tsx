import { useEffect, useState } from "react";

import { Sheet } from "@sassy/ui/sheet";

import { ToggleButton } from "./_components/ToggleButton";
import { XBoosterSidebar } from "./XBoosterSidebar";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { useSidebarStore } from "./stores/sidebar-store";

interface AppProps {
  shadowRoot: HTMLElement;
}

export default function App({ shadowRoot }: AppProps) {
  const { isOpen, setIsOpen } = useSidebarStore();
  const setShadowRoot = useShadowRootStore((s) => s.setShadowRoot);
  const [showOpenButton, setShowOpenButton] = useState(true);

  // Store shadow root ref for Radix portals
  useEffect(() => {
    setShadowRoot(shadowRoot);
  }, [shadowRoot, setShadowRoot]);

  // Handle button visibility with animation delay
  useEffect(() => {
    if (isOpen) {
      setShowOpenButton(false);
    } else {
      const timer = setTimeout(() => setShowOpenButton(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      {/* Open button — fixed on right edge */}
      {showOpenButton && (
        <div className="fixed top-1/2 right-0 z-[9999] -translate-y-1/2">
          <ToggleButton isOpen={false} onToggle={() => setIsOpen(true)} />
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <XBoosterSidebar onClose={() => setIsOpen(false)} />
      </Sheet>
    </>
  );
}
