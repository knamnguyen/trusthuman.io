"use client";

import Image from "next/image";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";

import { useMobileSignupModal } from "~/hooks/use-mobile-signup-modal";
import { MESSAGING } from "./landing-content";
import { MobileSignupForm } from "./mobile-signup-form";
import { MobileSignupModal } from "./mobile-signup-modal";

export function HeroSection() {
  const { isOpen, closeModal } = useMobileSignupModal();

  const handleScrollToCTA = () => {
    document
      .getElementById("final-cta")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-card w-full">
      <div className="container flex flex-col items-center gap-6 py-24 text-center sm:py-32">
      <Image
        src="/email-assets/kit-sprite-blink.gif"
        alt="EngageKit Logo"
        width={120}
        height={120}
        unoptimized
        className="mt-[-50px] mb-[-50px] h-70 w-70"
      />

      {/* Headline */}
      <h1 className="text-5xl font-extrabold tracking-tighter sm:text-7xl">
        {MESSAGING.hero.headline}
      </h1>

      {/* Subheadline */}
      <p className="max-w-2xl text-lg text-muted-foreground">
        {MESSAGING.hero.subheadline}
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl justify-center">
        {/* Mobile & iPad: Show signup form */}
        <div className="block lg:hidden w-full">
          <MobileSignupForm />
        </div>

        {/* Desktop: Show buttons */}
        <div className="hidden lg:flex gap-4">
          <Button
            size="lg"
            onClick={() => {
              window.open(
                "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
                "_blank",
              );
            }}
          >
            {MESSAGING.hero.primaryCTA}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              document
                .getElementById("context-engine")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {MESSAGING.hero.secondaryCTA}
          </Button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        {MESSAGING.hero.trustBadges.map((badge, index) => (
          <span key={badge} className="flex items-center gap-4">
            <span>{badge}</span>
            {index < MESSAGING.hero.trustBadges.length - 1 && (
              <span className="text-border">•</span>
            )}
          </span>
        ))}
      </div>

      {/* Mobile Signup Modal */}
      <MobileSignupModal isOpen={isOpen} onClose={closeModal} />
      </div>
    </section>
  );
}
