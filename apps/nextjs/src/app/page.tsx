import { ActivityFeedSection } from "./_components/landing/activity-feed-section";
import { BadgeShowcaseSection } from "./_components/landing/badge-showcase-section";
import { FinalCTASection } from "./_components/landing/final-cta-section";
import { Footer } from "./_components/landing/footer";
import { Header } from "./_components/landing/header";
import { HeroSection } from "./_components/landing/hero-section";
import { HowItWorksSection } from "./_components/landing/how-it-works-section";
import { LeaderboardPreviewSection } from "./_components/landing/leaderboard-preview-section";
import { VideoDemoSection } from "./_components/landing/video-demo-section";

export default function HomePage() {
  return (
    <div className="bg-card text-foreground">
      <Header />

      <main>
        {/* Section 1: Hero with live counter */}
        <HeroSection />

        {/* Section 2: Full Video Demo */}
        <VideoDemoSection />

        {/* Section 3: How It Works (step cards with video previews) */}
        <HowItWorksSection />

        {/* Section 4: Badge Showcase (LinkedIn, X, TrustHuman profile) */}
        <BadgeShowcaseSection />

        {/* Section 5: Live Activity Feed */}
        <ActivityFeedSection />

        {/* Section 6: Leaderboard Preview */}
        <LeaderboardPreviewSection />

        {/* Section 7: Final CTA */}
        <FinalCTASection />
      </main>

      <Footer />
    </div>
  );
}
