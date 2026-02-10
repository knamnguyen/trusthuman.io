"use client";

import { useEffect, useState } from "react";

import { Button } from "@sassy/ui/button";
import { cn } from "@sassy/ui/utils";

export const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleRedirect = () => {
    window.open(
      "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
      "_blank",
    );
    // To revert to Tally popup:
    // if (typeof window !== "undefined" && (window as any).Tally) {
    //   (window as any).Tally.openPopup("woN0Re", { layout: "modal", width: 700 });
    // }
  };

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button if user has scrolled down past the hero section
      if (window.pageYOffset > window.innerHeight * 0.8) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div
      className={cn(
        "fixed right-8 bottom-8 z-50 transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-24",
      )}
    >
      {/* Original redirect preserved - https://chrome.google.com/webstore/detail/inobbppddbakbhhfkfkinmicnbpeekok */}
      <Button
        onClick={handleRedirect}
        size="lg"
        className="h-16 cursor-pointer rounded-md border-2 border-border bg-primary px-8 text-xl font-bold text-primary-foreground shadow-[6px_6px_0px_#000] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
      >
        Build relationships now
      </Button>
    </div>
  );
};
