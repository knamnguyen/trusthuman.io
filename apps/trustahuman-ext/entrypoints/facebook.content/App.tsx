import { useEffect, useState } from "react";

import { Sheet } from "@sassy/ui/sheet";
import { ToasterSimple } from "@sassy/ui/toast";

import { useSidebarStore } from "./stores/sidebar-store";
import { useShadowRootStore } from "../linkedin.content/stores/shadow-root-store";
import { VerificationSidebar } from "../linkedin.content/VerificationSidebar";
import { ToggleButton } from "../linkedin.content/ToggleButton";

interface AppProps {
  shadowRoot: ShadowRoot | HTMLElement;
}

export default function App({ shadowRoot }: AppProps) {
  const { isOpen, setIsOpen } = useSidebarStore();
  const setShadowRoot = useShadowRootStore((s) => s.setShadowRoot);
  const [showOpenButton, setShowOpenButton] = useState(true);

  useEffect(() => {
    setShadowRoot(shadowRoot as HTMLElement);
    console.log("TrustAHuman FB: App mounted, shadowRoot:", shadowRoot);
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
      <ToasterSimple container={shadowRoot as HTMLElement} position="bottom-center" />

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
