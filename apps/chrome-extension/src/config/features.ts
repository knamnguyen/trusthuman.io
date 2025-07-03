export const FEATURE_CONFIG = {
  maxPosts: {
    isPremium: false,
    freeTierLimit: 20,
    premiumTierLimit: 50,
  },
  duplicateAuthorCheck: {
    isPremium: true,
  },
  postAgeFilter: {
    isPremium: true,
  },
} as const;
