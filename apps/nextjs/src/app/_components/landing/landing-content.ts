// apps/nextjs/src/app/_components/landing/landing-content.ts
// Single source of truth for all landing page content

// Use relative paths - works in both dev and production
// Absolute URLs can cause issues if NEXT_PUBLIC_APP_URL isn't set or videos aren't deployed
const ASSET_BASE = "";

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
    // Full flow demo video for hero section
    videoPath: `${ASSET_BASE}/videos/trusthuman-full-demo.mp4`,
    // YouTube fallback with autoplay params
    youtubeEmbedUrl: "https://www.youtube.com/embed/Cy4vVp9YVPM?autoplay=1&mute=1&loop=1&playlist=Cy4vVp9YVPM&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1",
  },

  howItWorks: {
    headline: "How It Works",
    subheadline: "Four simple steps to your verified Human badge",
    steps: [
      {
        number: 1,
        title: "Engage on Social Media",
        description:
          "Comment, like, and engage on LinkedIn, X, or Facebook as you normally would. Triss watches for your activity.",
        videoPath: `${ASSET_BASE}/videos/step-1-engage.mp4`,
        youtubeEmbedUrl: "https://www.youtube.com/embed/dqjEz6XcmZ8?autoplay=1&mute=1&loop=1&playlist=dqjEz6XcmZ8&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3&fs=0&playsinline=1",
      },
      {
        number: 2,
        title: "Verify with Webcam",
        description:
          "Quick selfie verification confirms you're human. Photo deleted instantly - we never store your images.",
        videoPath: `${ASSET_BASE}/videos/step-2-verify.mp4`,
        youtubeEmbedUrl: "https://www.youtube.com/embed/1JznLLdDZCs?autoplay=1&mute=1&loop=1&playlist=1JznLLdDZCs&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3&fs=0&playsinline=1",
      },
      {
        number: 3,
        title: "Build Your Profile",
        description:
          "Every verified action adds to your public profile. Show off your real human engagement history.",
        videoPath: `${ASSET_BASE}/videos/step-3-profile.mp4`,
        youtubeEmbedUrl: "https://www.youtube.com/embed/5mbRZM5uHbw?autoplay=1&mute=1&loop=1&playlist=5mbRZM5uHbw&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3&fs=0&playsinline=1",
      },
      {
        number: 4,
        title: "Compete & Customize",
        description:
          "Customize your profile, build streaks, and compete with friends on the leaderboard.",
        videoPath: `${ASSET_BASE}/videos/step-4-compete.mp4`,
        youtubeEmbedUrl: "https://www.youtube.com/embed/8fkY2T_LamM?autoplay=1&mute=1&loop=1&playlist=8fkY2T_LamM&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3&fs=0&playsinline=1",
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
  videos: {
    fullDemo: `${ASSET_BASE}/videos/trusthuman-full-demo.mp4`,
    step1Engage: `${ASSET_BASE}/videos/step-1-engage.mp4`,
    step2Verify: `${ASSET_BASE}/videos/step-2-verify.mp4`,
    step3Profile: `${ASSET_BASE}/videos/step-3-profile.mp4`,
    step4Compete: `${ASSET_BASE}/videos/step-4-compete.mp4`,
  },
  chromeWebStoreUrl: "https://chromewebstore.google.com/detail/trusthuman/fgoghbbgplmlpjccglfbaccokbklhnal"
};
