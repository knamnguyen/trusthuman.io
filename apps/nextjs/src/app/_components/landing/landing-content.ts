// apps/nextjs/src/app/_components/landing/landing-content.ts
// Single source of truth for all landing page content

// Base URL for assets - using absolute URLs for better mobile video support
const ASSET_BASE = "https://engagekit.io";

export const MESSAGING = {
  hero: {
    headline: "Build a personal brand that closes deals",
    subheadline:
      "Transform LinkedIn engagement from noise into revenue. Connect with decision-makers authentically, stay top-of-mind, and turn relationships into business outcomes.",
    primaryCTA: "Start Building Relationships",
    secondaryCTA: "Watch Demo",
    trustBadges: [
      "1000+ professionals",
      "500k+ comments generated",
      "Used by founders at top startups",
    ],
  },

  opportunity: {
    headline: "Why LinkedIn Matters for B2B",
    subheadline: "The platform where business relationships begin",
    stats: [
      {
        number: "80%",
        label: "of B2B leads",
        description: "come from LinkedIn",
        source: "LinkedIn Marketing Solutions",
      },
      {
        number: "54%",
        label: "of buyers",
        description: "research vendors on LinkedIn before purchasing",
        source: "LinkedIn State of Sales Report",
      },
      {
        number: "10x",
        label: "higher conversion",
        description: "vs. cold outreach",
        source: "Internal EngageKit Data",
      },
    ],
  },

  socialProof: {
    images: [
      {
        src: "/pictures/follower graph before and after using.png",
        caption: "Building a network of decision-makers",
        alt: "Graph showing network growth over time",
      },
      {
        src: "/pictures/boost profile appearances 150k.png",
        caption: "150k professionals discovered your expertise",
        alt: "Profile appearances reaching 150k",
      },
      {
        src: "/pictures/boost profile appearances 180k.png",
        caption: "180k potential connections reached",
        alt: "Profile appearances reaching 180k",
      },
      {
        src: "/pictures/many people reply organically to comments.png",
        caption: "Real conversations that lead to opportunities",
        alt: "Users replying to comments organically",
      },
      {
        src: "/pictures/get people like Jasmine the LinkedIn guru to reply to you.png",
        caption: "Build relationships with industry leaders",
        alt: "Industry leader replying to user comment",
      },
      {
        src: "/pictures/attract network of recruiters, investors, founders.png",
        caption: "Connect with the people who matter for your goals",
        alt: "Network of professionals including recruiters and investors",
      },
    ],
  },

  problemSolution: {
    problem: {
      title: "The Old Way Kills Credibility",
      points: [
        "Generic 'Great post!' comments that scream automation",
        "Spammy engagement that damages your brand",
        "No context or relevance to the conversation",
        "One-size-fits-all replies that get ignored",
        "Zero strategic thinking or relationship building",
      ],
    },
    solution: {
      title: "The EngageKit Way Builds Trust",
      points: [
        "Context-aware comments that add value to conversations",
        "Human-reviewed interactions that maintain authenticity",
        "Strategic targeting of high-value connections",
        "Personalized engagement that respects your voice",
        "Relationship-first approach that drives real outcomes",
      ],
    },
  },

  howItWorks: {
    headline: "How It Works",
    subheadline: "Three steps to meaningful LinkedIn engagement",
    steps: [
      {
        number: 1,
        title: "Compose Context-Aware Comments",
        description:
          "Our AI analyzes post content, author background, and conversation tone to draft thoughtful, relevant comments. You review and refine before posting.",
        videoPath: `${ASSET_BASE}/preview-demo/engagekit-compose-preview.mp4`,
      },
      {
        number: 2,
        title: "Build Your Target Network",
        description:
          "Create lists of high-value connections—prospects, partners, investors, or thought leaders. Focus your engagement where it matters most.",
        videoPath: `${ASSET_BASE}/preview-demo/engagekit-target-list-preview.mp4`,
      },
      {
        number: 3,
        title: "Track Meaningful Engagement",
        description:
          "Monitor interactions that lead to relationships, not just vanity metrics. See which connections convert to meetings, partnerships, and revenue.",
        videoPath: `${ASSET_BASE}/preview-demo/engagekit-analytics-preview.mp4`,
      },
    ],
  },

  contextEngine: {
    headline: "Context is Your Competitive Advantage. See how in 3 min",
    subheadline:
      "Generic comments are noise. Context-aware engagement opens doors.",
    description:
      "EngageKit's Context Engine analyzes every post's content, the author's industry and role, recent conversation patterns, and your relationship history. The result? Comments that sound like you wrote them—because you approve every one.",
    youtubeUrl: "https://www.youtube.com/embed/JKpkQG_zB6U",
    personas: [
      {
        icon: "Rocket",
        title: "For Founders",
        example: "Engaging with a VC's thought leadership post",
        context:
          "References your startup's space, shows industry knowledge, opens door for intro",
        result: "Meeting request within 48 hours",
      },
      {
        icon: "Handshake",
        title: "For Sales",
        example: "Commenting on a prospect's company announcement",
        context:
          "Congratulates milestone, relates to their pain points, hints at your solution",
        result: "Warm intro for discovery call",
      },
      {
        icon: "TrendingUp",
        title: "For Growth",
        example: "Engaging with a target account's thought leader",
        context:
          "Adds insight to their post, positions your brand, builds top-of-mind awareness",
        result: "Inbound demo request",
      },
    ],
  },

  keyFeatures: {
    headline: "Everything You Need for Strategic Engagement",
    features: [
      {
        icon: "Brain",
        title: "Context-Aware AI",
        description:
          "Analyzes post content, author background, and conversation tone to draft relevant comments",
      },
      {
        icon: "UserCheck",
        title: "Human-in-the-Loop",
        description:
          "Review, refine, and approve every comment before it goes live. Maintain full control and authenticity",
      },
      {
        icon: "Target",
        title: "Strategic Targeting",
        description:
          "Build lists of high-value connections and focus your engagement where it drives results",
      },
      {
        icon: "BarChart3",
        title: "Engagement Analytics",
        description:
          "Track meaningful interactions that lead to business outcomes, not just vanity metrics",
      },
      {
        icon: "Users",
        title: "Multi-Account Management",
        description:
          "Manage multiple LinkedIn profiles from one dashboard. Perfect for teams and agencies",
      },
      {
        icon: "Paintbrush",
        title: "Style Customization",
        description:
          "Train the AI on your unique voice, tone, and style. Every comment sounds like you",
      },
    ],
  },

  targetPersonas: {
    headline: "Who This Is For",
    subheadline:
      "Strategic professionals who understand that relationships drive revenue",
    personas: [
      {
        icon: "Rocket",
        title: "Startup Founders & CEOs",
        description: "Build thought leadership and credibility in your space",
        useCases: [
          "Connect with potential investors",
          "Engage with early adopters and customers",
          "Establish industry authority",
          "Build strategic partnerships",
        ],
      },
      {
        icon: "Handshake",
        title: "Sales & Business Development",
        description: "Warm up prospects before outreach and stay top-of-mind",
        useCases: [
          "Build rapport with decision-makers",
          "Create warm intros for cold prospects",
          "Maintain relationships with existing clients",
          "Drive pipeline from relationship-building",
        ],
      },
      {
        icon: "TrendingUp",
        title: "Growth & Marketing Teams",
        description: "Amplify brand presence and generate inbound interest",
        useCases: [
          "Engage with target accounts at scale",
          "Build community around your product",
          "Position executives as thought leaders",
          "Generate inbound leads from authentic engagement",
        ],
      },
    ],
  },

  reduceSlop: {
    headline: "Cut Through the Slop. Engage 10x Faster.",
    subheadline:
      "LinkedIn is drowning in AI-generated spam. We help you rise above it.",
    coreValueProp:
      "EngageKit helps you read and remember your engagement with others at 10x the speed and effectiveness.",
    benefits: [
      {
        icon: "Zap",
        title: "Read Faster",
        description: "Scan posts and context in seconds, not minutes",
      },
      {
        icon: "Brain",
        title: "Remember Everything",
        description: "Full history of every interaction with every connection",
      },
      {
        icon: "User",
        title: "Engage Authentically",
        description: "Human-in-the-loop ensures your voice stays yours",
      },
      {
        icon: "Handshake",
        title: "Build Real Relationships",
        description: "Context-aware comments that start real conversations",
      },
      {
        icon: "Sparkles",
        title: "Stand Out from Slop",
        description: "Your comments sound like you, not a bot",
      },
      {
        icon: "Clock",
        title: "10x Your Output",
        description: "Do in 10 minutes what used to take 2 hours",
      },
    ],
  },

  testimonials: [
    {
      name: "Lisa Thompson",
      title: "Operations Manager",
      quote:
        "EngageKit helped me build genuine relationships with potential clients. Three partnerships started from LinkedIn conversations I never would have had time for otherwise.",
      image:
        "/testimonials/american middle aged women business professional.jpg",
    },
    {
      name: "Jamal Brooks",
      title: "Computer Science Student",
      quote:
        "Instead of generic applications, I engaged with hiring managers on LinkedIn. The conversations led to two internship offers before I even applied formally.",
      image:
        "/testimonials/black student in america building a personal brand for recruiting.jpg",
    },
    {
      name: "Li Mei",
      title: "High School Senior",
      quote:
        "I connected with alumni and professors through thoughtful engagement. It made my university applications stand out, and acceptance letters followed.",
      image:
        "/testimonials/chinese student applying to university from high school girl.jpg",
    },
    {
      name: "Sofía García",
      title: "Graphic Designer",
      quote:
        "Authentic engagement with potential clients changed my freelance business. Three long-term contracts came from LinkedIn relationships this quarter.",
      image: "/testimonials/creative professional european 27 years old.jpg",
    },
    {
      name: "Thomas Müller",
      title: "Sales Director",
      quote:
        "Prospects now recognize my name before our first call. EngageKit helped me warm up my pipeline, and my close rate jumped 40%.",
      image:
        "/testimonials/german business man middle age in office setting.jpg",
    },
    {
      name: "Chloe Wong",
      title: "Marketing Manager",
      quote:
        "Strategic engagement with target accounts tripled our inbound demo requests. The ROI on relationship-building is incredible.",
      image:
        "/testimonials/hong kong girl professional 30 years old marketing.jpg",
    },
    {
      name: "Marek Novak",
      title: "Animation Storyteller",
      quote:
        "I stay connected with industry leaders without sacrificing creative time. Two studio partnerships started from LinkedIn conversations this year.",
      image:
        "/testimonials/storyteller animation 40 somthing man from europe.jpg",
    },
    {
      name: "Aisha Khan",
      title: "Law Student",
      quote:
        "Engaging with legal professionals opened mentorship opportunities I never expected. Two job offers came from relationships I built on LinkedIn.",
      image: "/testimonials/young muslim girl from south asia studying law.jpg",
    },
  ],

  pricing: {
    headline: "Pricing",
    subheadline: "Start free. Scale as you grow.",
    billingToggle: {
      monthly: "Monthly",
      yearly: "Yearly (Save 17%)",
    },
    tiers: [
      {
        id: "free",
        name: "Free",
        badge: "Get Started",
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: "Perfect for testing the platform",
        features: [
          "Limited engagements per day",
          "Basic AI drafts",
          "Manual mode only",
          "7-day interaction history",
          "Community support",
        ],
        cta: "Start Free",
        ctaLink:
          "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
      },
      {
        id: "premium-single",
        name: "Premium Single",
        badge: "Most Popular",
        monthlyPrice: 29.99,
        yearlyPrice: 299.99,
        description: "For individual professionals",
        accountCount: 1,
        features: [
          "Unlimited engagements",
          "Advanced context engine",
          "Human-in-the-loop workflow",
          "Custom style training",
          "Full analytics dashboard",
          "Priority email support",
          "All future updates included",
        ],
        cta: "Start Free Trial",
        ctaLink:
          "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
        featured: true,
      },
      {
        id: "premium-multi",
        name: "Premium Multi",
        badge: "Teams & Agencies",
        monthlyPricePerAccount: 29.99,
        yearlyPricePerAccount: 299.99,
        description: "For teams managing multiple accounts",
        accountRange: { min: 2, max: 24 },
        features: [
          "All Premium Single features",
          "Team management dashboard",
          "Shared style guides",
          "Centralized billing",
          "Account manager support",
          "Custom onboarding",
          "Volume discounts available",
        ],
        cta: "Contact Sales",
        ctaLink:
          "mailto:knamnguyen.work@gmail.com?subject=Premium Multi Inquiry",
      },
    ],
  },

  faq: {
    headline: "Frequently Asked Questions",
    questions: [
      {
        question: "Will this help me build real business relationships?",
        answer:
          "Yes, EngageKit focuses on strategic engagement with context-aware comments that start meaningful conversations. Users report increased meeting requests and partnership opportunities within 30-60 days of consistent use.",
      },
      {
        question: "How is this different from automation tools?",
        answer:
          "EngageKit is human-in-the-loop. You review and approve every interaction before it goes live. We provide intelligent drafts based on context, but you maintain full control and authenticity. No bots, no APIs, no spam.",
      },
      {
        question: "What results can I expect?",
        answer:
          "Results vary based on your goals and consistency, but users typically see 3-5x higher response rates, more meaningful conversations, and measurable business outcomes (meetings, partnerships, deals) within 30-60 days. Relationship-building is a long-term investment.",
      },
      {
        question: "Is this ethical and safe for my LinkedIn account?",
        answer:
          "Yes. EngageKit operates client-side (no bots or server automation), respects LinkedIn's terms of service, and maintains authentic engagement patterns. You're in full control of every interaction. We prioritize account safety and authenticity.",
      },
      {
        question: "What's included in the free tier?",
        answer:
          "The free tier includes basic AI drafts, manual mode, limited daily engagements, and 7-day interaction history. It's perfect for testing the platform and understanding the workflow before upgrading to unlock advanced features like custom style training and unlimited engagements.",
      },
      {
        question: "How does pricing work for multiple accounts?",
        answer:
          "Premium Multi pricing is per account—$29.99/month or $299.99/year per account. Use the slider in the pricing section to calculate your total cost based on account count. Volume discounts available for 10+ accounts.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes, you can cancel your subscription anytime with no penalties or long-term contracts. Your access continues through the end of your current billing period.",
      },
      {
        question: "What kind of support do you offer?",
        answer:
          "Free users get community support via our Discord. Premium users get priority email support with 24-hour response times. Premium Multi users get dedicated account management and custom onboarding sessions.",
      },
    ],
  },

  finalCTA: {
    headline: "Ready to build relationships that close deals?",
    subheadline:
      "Join 1000+ professionals using EngageKit to transform LinkedIn engagement into revenue.",
    primaryCTA: "Start Free Today",
    primaryLink:
      "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
    secondaryCTA: "Book a Demo",
    secondaryLink: "mailto:knamnguyen.work@gmail.com?subject=Demo Request",
  },
};

export const ASSETS = {
  videos: {
    composePreview: `${ASSET_BASE}/preview-demo/engagekit-compose-preview.mp4`,
    targetListPreview: `${ASSET_BASE}/preview-demo/engagekit-target-list-preview.mp4`,
    analyticsPreview: `${ASSET_BASE}/preview-demo/engagekit-analytics-preview.mp4`,
    accountTabPreview: `${ASSET_BASE}/preview-demo/engagekit-account-tab-preview.mp4`,
  },
  youtube: {
    overviewVideo: "https://www.youtube.com/embed/JKpkQG_zB6U",
  },
  logos: {
    main: "/engagekit-logo.svg",
    sprites: {
      blink: "/engagekit-sprite-blink.svg",
    },
  },
};

// Utility functions for content
export function getFormattedPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

export function calculateTotalPrice(
  pricePerAccount: number,
  accountCount: number,
): number {
  return pricePerAccount * accountCount;
}

export function getSavingsPercentage(monthly: number, yearly: number): number {
  const monthlyCost = monthly * 12;
  const savings = ((monthlyCost - yearly) / monthlyCost) * 100;
  return Math.round(savings);
}
