"use client";

import { Button } from "@sassy/ui/button";

export const FinalCTASection = () => {
  const handleRedirect = () => {
    window.open(
      "https://chromewebstore.google.com/detail/engagekit/your-extension-id",
      "_blank",
    );
  };

  return (
    <section id="final-cta" className="bg-zinc-900 py-20 text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-extrabold tracking-tighter text-white sm:text-7xl">
          Get EngageKit.
        </h2>
        <p className="mt-4 text-8xl font-extrabold tracking-tighter text-pink-500">
          Free.
        </p>
        <div className="mt-8">
          <Button
            onClick={handleRedirect}
            className="h-20 rounded-full bg-pink-500 px-16 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-pink-600"
          >
            I want this!
          </Button>
        </div>
      </div>
    </section>
  );
};
