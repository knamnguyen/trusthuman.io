// import Script from "next/script"; // Commented out: Tally embed script
import { FaqSection } from "./_components/landing/faq-section";
import { FinalCTASection } from "./_components/landing/final-cta-section";
import { FloatingCTA } from "./_components/landing/floating-cta";
import { Footer } from "./_components/landing/footer";
import { Header } from "./_components/landing/header";
import { HeroSection } from "./_components/landing/hero-section";
import { ContextEngineSection } from "./_components/landing/sections/context-engine-section";
import { HowItWorksSection } from "./_components/landing/sections/how-it-works-section";
import { KeyFeaturesGrid } from "./_components/landing/sections/key-features-grid";
import { OpportunitySection } from "./_components/landing/sections/opportunity-section";
import { PricingSection } from "./_components/landing/sections/pricing-section";
import { ProblemSolutionSection } from "./_components/landing/sections/problem-solution-section";
import { ReduceSlopSection } from "./_components/landing/sections/reduce-slop-section";
import { SocialProofCarousel } from "./_components/landing/sections/social-proof-carousel";
import { TargetPersonasSection } from "./_components/landing/sections/target-personas-section";
import { TestimonialsSection } from "./_components/landing/testimonials-section";

export default function HomePage() {
  return (
    <div className="bg-card text-foreground overflow-x-hidden">
      <Header />

      {/* Affiliate Banner - sticky positioned right under the header */}
      <div className="bg-secondary fixed top-18 z-40 w-full py-2">
        <a
          href="https://engagekit.endorsely.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="animate-bounce-light text-ld text-secondary-foreground text-center font-bold">
            Early Affiliate Special: earn up to $1200 a year by referring
            potential users for EngageKit
          </div>
        </a>
      </div>

      <main className="pt-24">
        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: The Opportunity */}
        <OpportunitySection />

        {/* Section 2.5: Social Proof Carousel */}
        <SocialProofCarousel />

        {/* Section 3: Problem → Solution Bridge */}
        <ProblemSolutionSection />

        {/* Section 4: How It Works */}
        <HowItWorksSection />

        {/* Section 5: Context Engine (Star Feature) */}
        <ContextEngineSection />

        {/* Section 6: Key Features Grid */}
        <KeyFeaturesGrid />

        {/* Section 7: Who This Is For */}
        <TargetPersonasSection />

        {/* Section 8: Reduce Slop & Spam */}
        <ReduceSlopSection />

        {/* Section 9: Testimonials */}
        <TestimonialsSection />

        {/* Section 10: Pricing */}
        <PricingSection />

        {/* Section 11: FAQ */}
        <FaqSection />

        {/* Section 12: Final CTA */}
        <FinalCTASection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
