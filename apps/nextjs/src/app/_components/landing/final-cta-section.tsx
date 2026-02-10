"use client";

import { Button } from "@sassy/ui/button";

import { MESSAGING } from "./landing-content";

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
    <section id="final-cta" className="bg-foreground py-20">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-background sm:text-5xl mb-4">
          {MESSAGING.finalCTA.headline}
        </h2>
        <p className="text-xl text-muted mb-8">
          {MESSAGING.finalCTA.subheadline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground border-2 border-background shadow-[4px_4px_0px_hsl(var(--background))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--background))] transition-all font-bold text-lg"
          >
            <a href={MESSAGING.finalCTA.primaryLink} target="_blank" rel="noopener noreferrer">
              {MESSAGING.finalCTA.primaryCTA}
            </a>
          </Button>

          <Button
            asChild
            size="lg"
            variant="secondary"
            className="border-2 border-background shadow-[4px_4px_0px_hsl(var(--background))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--background))] transition-all font-bold text-lg"
          >
            <a href={MESSAGING.finalCTA.secondaryLink}>
              {MESSAGING.finalCTA.secondaryCTA}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
