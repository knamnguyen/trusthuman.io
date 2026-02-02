export const autoCommentConfigurationDefaults = {
  scrollDuration: 5,
  commentDelay: 5,
  maxPosts: 5,
  duplicateWindow: 24,
  finishListModeEnabled: false,
  commentAsCompanyEnabled: false,
  timeFilterEnabled: false,
  minPostAge: 1,
  manualApproveEnabled: false,
  authenticityBoostEnabled: false,
  defaultCommentStyle: "PROFESSIONAL" as const,
  targetListId: undefined,
  commentStyleId: undefined,
  commentProfileName: "",
  languageAwareEnabled: false,
  skipCompanyPagesEnabled: false,
  blacklistEnabled: false,
  skipPromotedPostsEnabled: false,
  skipFriendActivitiesEnabled: false,
  targetListEnabled: false,
  hitlMode: false,
};

export const FREE_BUILD_TARGET_LIST_WEEKLY_LIMIT = 10;
export const PREMIUM_BUILD_TARGET_LIST_WEEKLY_LIMIT = 100;

function startOfWeek(now: Date): Date {
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day; // Adjust to previous Sunday
  const date = new Date(now.setDate(diff));
  date.setHours(0, 0, 0, 0); // Set to midnight
  return date;
}

/**
 * Get build target list limits based on org subscription status.
 * Takes isPremium boolean from organization's subscriptionTier.
 */
export const getOrgBuildTargetListLimits = (
  isPremium: boolean,
  now: Date = new Date(),
) => {
  const lastRefreshedAt = startOfWeek(now);
  const limit = isPremium
    ? PREMIUM_BUILD_TARGET_LIST_WEEKLY_LIMIT
    : FREE_BUILD_TARGET_LIST_WEEKLY_LIMIT;

  return {
    limit,
    lastRefreshedAt,
    refreshesAt: new Date(lastRefreshedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
};

export interface CommentStyleConfig {
  /** ID of the style (null if using default) */
  styleId: string | null;
  /** Style guide / content - instructions for AI */
  styleGuide: string;
  /** Maximum words (1-300), default 100 */
  maxWords: number;
  /** Creativity / temperature (0-2), default 1.0 */
  creativity: number;
  /** Name of the style for logging */
  styleName: string | null;
}

export const DEFAULT_STYLE_GUIDE = `Keep it short, authentic, and conversational.
Sound like a real person, not a corporate account.
Use casual language when appropriate.`;

// Default config when no style is selected
export const DEFAULT_COMMENT_STYLE_CONFIG: CommentStyleConfig = {
  styleId: null,
  styleGuide: DEFAULT_STYLE_GUIDE,
  maxWords: 100,
  creativity: 1.0,
  styleName: null,
};
