"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { ASSETS } from "./landing/landing-content";

/**
 * Global toast that prompts users to install the extension
 * Only shown when:
 * 1. User is signed in (we have their account)
 * 2. Extension is NOT installed (no DOM marker)
 * 3. User hasn't dismissed the toast recently
 * 4. User has completed onboarding (not shown during onboarding modal)
 */
export function ExtensionInstallToast() {
  const [showToast, setShowToast] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(true); // Assume installed until proven otherwise

  useEffect(() => {
    // Check if extension is installed by looking for DOM marker
    // The extension content script injects: data-trusthuman-ext="installed"
    const checkExtension = () => {
      const marker = document.documentElement.getAttribute("data-trusthuman-ext");
      const installed = marker === "installed";
      setIsExtensionInstalled(installed);

      // Don't show toast if onboarding modal might be showing
      const hasCompletedOnboarding = localStorage.getItem("trusthuman-onboarding-complete");
      if (!hasCompletedOnboarding) {
        return;
      }

      // Check if user has dismissed toast recently (stored in localStorage)
      const dismissedAt = localStorage.getItem("trusthuman-toast-dismissed");
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        // Don't show again for 24 hours after dismissal
        if (hoursSinceDismissed < 24) {
          return;
        }
      }

      // Show toast if extension not installed
      if (!installed) {
        // Delay showing toast by 2 seconds to avoid flash
        setTimeout(() => setShowToast(true), 2000);
      }
    };

    // Check after a short delay to give extension time to inject marker
    const timeoutId = setTimeout(checkExtension, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleDismiss = () => {
    setShowToast(false);
    localStorage.setItem("trusthuman-toast-dismissed", Date.now().toString());
  };

  const handleInstall = () => {
    window.open(ASSETS.chromeWebStoreUrl, "_blank");
  };

  if (!showToast || isExtensionInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-card flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border-2 border-primary/20 p-4 sm:px-6 sm:py-4 shadow-2xl max-w-md sm:max-w-none mx-auto sm:mx-0">
        {/* Header row on mobile */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Triss mascot */}
          <Image
            src="/trusthuman-logo.svg"
            alt="Triss"
            width={40}
            height={40}
            className="h-10 w-10 sm:h-12 sm:w-12 shrink-0"
          />

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base">Install Chrome Extension</p>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Verify your comments on LinkedIn & X
            </p>
          </div>

          {/* Dismiss button - positioned in corner on mobile */}
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors sm:hidden shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action button - full width on mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={handleInstall} variant="primary" size="sm" className="flex-1 sm:flex-none">
            Install Now
          </Button>

          {/* Dismiss button - desktop only */}
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
