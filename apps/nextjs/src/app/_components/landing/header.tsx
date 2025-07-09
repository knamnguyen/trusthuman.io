"use client";

import Image from "next/image";

import { Button } from "@sassy/ui/button";

export const Header = () => {
  const handleScrollToCTA = () => {
    document
      .getElementById("final-cta")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b-2 border-black bg-zinc-50/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/engagekit-logo.svg"
            alt="EngageKit Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <h1 className="text-xl font-bold tracking-tight">EngageKit</h1>
        </div>
        <h1>
          <span className="hidden sm:inline">
            AI Intern that engage on LinkedIn for you 24/7
          </span>
        </h1>
        {/* Original Chrome extension link preserved for reference: */}
        {/* https://chrome.google.com/webstore/detail/inobbppddbakbhhfkfkinmicnbpeekok */}
        <Button
          onClick={() => {
            // Open Tally popup as centered modal
            if (typeof window !== "undefined" && (window as any).Tally) {
              (window as any).Tally.openPopup("woN0Re", {
                layout: "modal",
                width: 700,
              });
            }
          }}
          className="cursor-pointer rounded-md border-2 border-black bg-pink-500 font-bold text-white shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
          size="sm"
        >
          Join the PowerList
        </Button>
      </div>
    </header>
  );
};
