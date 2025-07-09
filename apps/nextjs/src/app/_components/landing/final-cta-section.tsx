"use client";

import { Button } from "@sassy/ui/button";

export const FinalCTASection = () => {
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
          {/* Original redirect preserved - https://chrome.google.com/webstore/detail/inobbppddbakbhhfkfkinmicnbpeekok */}
          <Button
            onClick={handleRedirect}
            className="h-auto cursor-pointer rounded-md border-2 border-black bg-pink-500 px-8 py-4 text-lg font-bold text-white shadow-[8px_8px_0px_#000] transition-all hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none sm:px-16 sm:text-2xl"
          >
            Let's f*cking grow on LinkedIn
          </Button>
        </div>
      </div>
    </section>
  );
};
