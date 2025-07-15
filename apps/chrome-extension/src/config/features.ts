export const FEATURE_CONFIG = {
  // Per-run maximum posts to comment on
  maxPosts: {
    isPremium: false,
    // Free users can run up to 10 comments per session
    freeTierLimit: 10,
    premiumTierLimit: 100,
  },
  // Daily comment cap (applies to both plans but still tracked)
  dailyComments: {
    isPremium: false,
    freeTierLimit: 100,
    premiumTierLimit: 100,
  },
  duplicateAuthorCheck: {
    isPremium: true,
  },
  postAgeFilter: {
    isPremium: true,
  },
  blacklistAuthor: {
    isPremium: true,
  },
  // Allow custom style guide for all users
  customStyleGuide: {
    isPremium: false,
  },
  commentAsCompanyPage: {
    isPremium: true,
  },

  languageAwareComment: {
    isPremium: true,
  },
  skipCompanyPages: {
    isPremium: true,
  },
} as const;
