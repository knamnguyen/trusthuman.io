"use client";

import { useCallback, useEffect, useState } from "react";

export const useMobileSignupModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollTimer, setScrollTimer] = useState<NodeJS.Timeout | null>(null);

  // Check if modal was already shown this session
  const getHasShownModal = useCallback(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("mobile-signup-modal-shown") === "true";
  }, []);

  // Mark modal as shown
  const markModalAsShown = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("mobile-signup-modal-shown", "true");
  }, []);

  // Mobile detection - match Tailwind's lg breakpoint (1024px)
  const checkIsMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  }, []);

  // Handle scroll with 3-second delay
  const handleScroll = useCallback(() => {
    if (!isMobile || getHasShownModal() || isOpen) return;

    if (!hasScrolled) {
      setHasScrolled(true);

      // Clear existing timer if any
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // Start 3-second timer
      const timer = setTimeout(() => {
        setIsOpen(true);
        markModalAsShown();
      }, 2000);

      setScrollTimer(timer);
    }
  }, [
    isMobile,
    hasScrolled,
    isOpen,
    scrollTimer,
    getHasShownModal,
    markModalAsShown,
  ]);

  // Handle window resize for mobile detection
  const handleResize = useCallback(() => {
    setIsMobile(checkIsMobile());
  }, [checkIsMobile]);

  // Initialize mobile detection
  useEffect(() => {
    setIsMobile(checkIsMobile());

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [handleResize, handleScroll, scrollTimer]);

  const openModal = useCallback(() => {
    setIsOpen(true);
    markModalAsShown();
  }, [markModalAsShown]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    isMobile,
  };
};
