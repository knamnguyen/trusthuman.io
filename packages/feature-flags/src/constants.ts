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

export const getBuildTargetListLimits = (
  accessType: "FREE" | (string & {}),
) => {
  if (accessType === "FREE") {
    return FREE_BUILD_TARGET_LIST_WEEKLY_LIMIT;
  }

  return PREMIUM_BUILD_TARGET_LIST_WEEKLY_LIMIT;
};
