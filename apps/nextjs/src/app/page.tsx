// import Script from "next/script"; // Commented out: Tally embed script

import { FaqSection } from "./_components/landing/faq-section";
import { FeaturesSection } from "./_components/landing/features-section";
import { FinalCTASection } from "./_components/landing/final-cta-section";
import { FloatingCTA } from "./_components/landing/floating-cta";
import { Footer } from "./_components/landing/footer";
import { GumroadCarousel } from "./_components/landing/gumroad-carousel";
import { Header } from "./_components/landing/header";
import { HeroSection } from "./_components/landing/hero-section";
import { TestimonialsSection } from "./_components/landing/testimonials-section";
import { VideoSection } from "./_components/landing/video-section";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-zinc-50 text-black">
      <Header />

      {/* Affiliate Banner - sticky positioned right under the header */}
      <div className="fixed top-16 z-40 w-full bg-pink-500 py-2">
        <a
          href="https://engagekit.endorsely.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="animate-bounce-light text-ld text-center font-bold text-white">
            Early Affiliate Special: earn up to $1200 a year by referring
            potential users for EngageKit
          </div>
        </a>
      </div>

      <main className="pt-24">
        <HeroSection />

        {/* Tally embed form commented out */}
        {/**
        <div className="container mx-auto max-w-3xl px-4 py-12 md:px-20">
          <Script
            src="https://tally.so/widgets/embed.js"
            strategy="afterInteractive"
          />
          <iframe
            data-tally-src="https://tally.so/embed/woN0Re?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="860"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="EngageKit PowerList"
          />
          <Script id="tally-load-embeds" strategy="afterInteractive">
            {`window.Tally && window.Tally.loadEmbeds && window.Tally.loadEmbeds();`}
          </Script>
        </div>
        */}
        <FeaturesSection />
        <div className="container mx-auto max-w-7xl px-4 py-12 md:px-20">
          <GumroadCarousel />
        </div>
        <VideoSection />
        <TestimonialsSection />
        <FinalCTASection />
        <FaqSection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
