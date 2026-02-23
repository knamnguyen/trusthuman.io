// apps/nextjs/src/app/_components/landing/landing-content.ts
// Single source of truth for all landing page content

export const MESSAGING = {
  hero: {
    headline: "Prove You're Human. Get Your Badge.",
    subheadline:
      "Verify your social engagement with a quick selfie. Build trust, stand out from bots, and showcase your authentic activity across LinkedIn and X.",
    primaryCTA: "Get Your Human #",
    secondaryCTA: "Watch Demo",
    trustBadges: [
      "Free to use",
      "Privacy-first (photos deleted instantly)",
      "Works on LinkedIn & X",
    ],
  },

  videoDemo: {
    headline: "See TrustHuman in Action",
    subheadline:
      "Watch how easy it is to verify your humanity in under 3 minutes",
    // TODO: Replace with actual YouTube URL once recorded
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },

  howItWorks: {
    headline: "How It Works",
    subheadline: "Four simple steps to your verified Human badge",
    steps: [
      {
        number: 1,
        title: "Install the Chrome Extension",
        description:
          "One-click install from the Chrome Web Store. Triss, your verification companion, will guide you through setup.",
        // TODO: Replace with actual video URLs
        videoPath: "/videos/step-1-install.mp4",
        youtubeEmbedUrl: "",
      },
      {
        number: 2,
        title: "Comment on LinkedIn or X",
        description:
          "Engage authentically on posts. When you click submit, Triss detects your activity and prepares for verification.",
        videoPath: "/videos/step-2-comment.mp4",
        youtubeEmbedUrl: "",
      },
      {
        number: 3,
        title: "Quick Selfie Verification",
        description:
          "Snap a quick selfie. Our AI confirms you're a real human (not a bot). Your photo is deleted immediately after verification.",
        videoPath: "/videos/step-3-verify.mp4",
        youtubeEmbedUrl: "",
      },
      {
        number: 4,
        title: "Earn Your Human Badge",
        description:
          "Get your unique Human # and public profile at trusthuman.io/username. Build your streak and climb the leaderboard.",
        videoPath: "/videos/step-4-badge.mp4",
        youtubeEmbedUrl: "",
      },
    ],
  },

  badgeShowcase: {
    headline: "Your Human Badge Everywhere",
    subheadline: "Stand out from the bots. Show you're real.",
    platforms: [
      {
        id: "linkedin",
        name: "LinkedIn",
        description: "Verified badge appears next to your profile",
      },
      {
        id: "x",
        name: "X / Twitter",
        description: "Show authenticity on your tweets and replies",
      },
      {
        id: "trusthuman",
        name: "TrustHuman Profile",
        description: "Your public page with full stats and activity history",
      },
    ],
  },

  activityFeed: {
    headline: "Recent Verified Activity",
    subheadline: "Real humans, real engagement, verified in real-time",
  },

  leaderboard: {
    headline: "Top Verified Humans",
    subheadline: "The most active verified humans on the platform",
    viewAllCTA: "See Full Leaderboard",
  },

  finalCTA: {
    headline: "Ready to prove you're human?",
    subheadline: "Join thousands of verified humans building trust online.",
    primaryCTA: "Get Your Human #",
  },

  footer: {
    tagline: "Building trust in the age of AI",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
    copyright: `© ${new Date().getFullYear()} TrustHuman. All rights reserved.`,
  },
};

export const ASSETS = {
  logos: {
    triss: "/trusthuman-logo.svg",
    trissAnimated: "/triss-blink.gif", // TODO: Create animated version
  },
  chromeWebStoreUrl: "https://chromewebstore.google.com/detail/trusthuman/TODO", // TODO: Update once published
};
