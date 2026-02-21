import { useEffect, useState } from "react";
import { Sheet } from "@sassy/ui/sheet";
import { ToasterSimple } from "@sassy/ui/toast";

import { ToggleButton } from "./ToggleButton";
import { VerificationSidebar } from "./VerificationSidebar";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { useSidebarStore } from "./stores/sidebar-store";

interface AppProps {
  shadowRoot: HTMLElement;
}

export default function App({ shadowRoot }: AppProps) {
  const { isOpen, setIsOpen } = useSidebarStore();
  const setShadowRoot = useShadowRootStore((s) => s.setShadowRoot);
  const [showOpenButton, setShowOpenButton] = useState(true);

  useEffect(() => {
    setShadowRoot(shadowRoot);
    console.log("TrustAHuman: App mounted, shadowRoot:", shadowRoot);
  }, [shadowRoot, setShadowRoot]);

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
      {/* Sonner toaster for Triss notifications - renders into shadow root */}
      <ToasterSimple container={shadowRoot} position="bottom-center" />

      {showOpenButton && (
        <div className="fixed top-1/2 right-0 z-[9999] -translate-y-1/2">
          <ToggleButton isOpen={false} onToggle={() => setIsOpen(true)} />
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <VerificationSidebar onClose={() => setIsOpen(false)} />
      </Sheet>
    </>
  );
}
