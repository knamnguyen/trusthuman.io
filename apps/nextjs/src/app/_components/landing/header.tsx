"use client";

import { Button } from "@sassy/ui/button";

export const Header = () => {
  const handleScrollToCTA = () => {
    document
      .getElementById("final-cta")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-zinc-50/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-bold tracking-tight">EngageKit</h1>
        <h1>AI Intern that engage on LinkedIn for you 24/7</h1>
        <Button
          onClick={handleScrollToCTA}
          className="bg-black text-white hover:bg-zinc-800"
          size="sm"
        >
          Add to Chrome
        </Button>
      </div>
    </header>
  );
};
