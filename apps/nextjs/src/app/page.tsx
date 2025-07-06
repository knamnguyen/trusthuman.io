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
      <main>
        <HeroSection />
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
