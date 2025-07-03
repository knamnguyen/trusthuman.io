import { FaqSection } from "./_components/landing/faq-section";
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
    <div className="bg-zinc-50 text-black">
      <Header />
      <main>
        <HeroSection />
        <GumroadCarousel />
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
