import { create } from "zustand";

// =============================================================================
// POST LOAD SETTINGS (Filters during Load Posts)
// =============================================================================

/**
 * Settings for filtering posts during the "Load Posts" collection process.
 * Maps to PostLoadSetting prisma model.
 */
export interface PostLoadSettings {
  /** Enable filtering posts by age */
  timeFilterEnabled: boolean;
  /** Maximum post age in hours (posts older than this are skipped) */
  minPostAge: number | null;

  /** Skip posts that are "X liked this" or "X commented on this" */
  skipFriendActivitiesEnabled: boolean;
  /** Skip posts from company/showcase pages */
  skipCompanyPagesEnabled: boolean;
  /** Skip sponsored/promoted posts */
  skipPromotedPostsEnabled: boolean;

  /** Enable blacklist filtering (disabled until DB integration) */
  skipBlacklistEnabled: boolean;
  /** Blacklist ID for filtering (disabled until DB integration) */
  blacklistId: string | null;

  /** Skip posts from 1st degree connections */
  skipFirstDegree: boolean;
  /** Skip posts from 2nd degree connections */
  skipSecondDegree: boolean;
  /** Skip posts from 3rd+ degree connections */
  skipThirdDegree: boolean;
  /** Skip posts from people you follow (not connected) */
  skipFollowing: boolean;

  /** Enable target list filtering - only engage with people on selected list */
  targetListEnabled: boolean;
  /** Selected target list ID for filtering (single selection) */
  selectedTargetListId: string | null;
  /** Cached profile URNs for the selected target list (max 25) */
  selectedTargetListUrns: string[];
}

const DEFAULT_POST_LOAD: PostLoadSettings = {
  timeFilterEnabled: false,
  minPostAge: null,
  skipFriendActivitiesEnabled: false,
  skipCompanyPagesEnabled: true,
  skipPromotedPostsEnabled: true,
  skipBlacklistEnabled: false,
  blacklistId: null,
  skipFirstDegree: false,
  skipSecondDegree: false,
  skipThirdDegree: false,
  skipFollowing: false,
  targetListEnabled: false,
  selectedTargetListId: null,
  selectedTargetListUrns: [],
};

// =============================================================================
// SUBMIT COMMENT SETTINGS (Actions when submitting comments)
// =============================================================================

/**
 * Settings for actions performed when submitting comments.
 * Maps to SubmitCommentSetting prisma model.
 */
export interface SubmitCommentSettings {
  /** Delay range between submissions in "min-max" format (seconds) */
  submitDelayRange: string;
  /** Like the post after commenting */
  likePostEnabled: boolean;
  /** Like your own comment after posting */
  likeCommentEnabled: boolean;
  /** Tag the post author at the end of your comment */
  tagPostAuthorEnabled: boolean;
  /** Attach a random image from your library to comments */
  attachPictureEnabled: boolean;
  // Note: Image library is managed by comment-image-store
}

const DEFAULT_SUBMIT_COMMENT: SubmitCommentSettings = {
  submitDelayRange: "5-20",
  likePostEnabled: true,
  likeCommentEnabled: true,
  tagPostAuthorEnabled: true,
  attachPictureEnabled: false,
};

// =============================================================================
// COMMENT GENERATE SETTINGS (AI generation options)
// =============================================================================

/**
 * Settings for AI comment generation.
 * Maps to CommentGenerateSetting prisma model.
 */
export interface CommentGenerateSettings {
  /** Default comment style ID (disabled until DB integration) */
  commentStyleId: string | null;
  /** Let AI dynamically choose style based on post (disabled until DB integration) */
  dynamicChooseStyleEnabled: boolean;
  /** Include existing comments on the post as context for AI */
  adjacentCommentsEnabled: boolean;
}

const DEFAULT_COMMENT_GENERATE: CommentGenerateSettings = {
  commentStyleId: null,
  dynamicChooseStyleEnabled: false,
  adjacentCommentsEnabled: false,
};

// =============================================================================
// BEHAVIOR SETTINGS (UI/UX toggles)
// =============================================================================

/**
 * Settings for extension behavior and UI features.
 * Previously in compose-store as ComposeSettings.
 */
export interface BehaviorSettings {
  /** 100% human mode - skip AI generation, write comments manually */
  humanOnlyMode: boolean;
  /** Auto-trigger generation when clicking LinkedIn's comment button */
  autoEngageOnCommentClick: boolean;
  /** Highlight most visible post and trigger engage on spacebar press */
  spacebarAutoEngage: boolean;
  /** Show floating post navigator UI for quick scrolling */
  postNavigator: boolean;
}

const DEFAULT_BEHAVIOR: BehaviorSettings = {
  humanOnlyMode: false,
  autoEngageOnCommentClick: false,
  spacebarAutoEngage: false,
  postNavigator: false,
};

// =============================================================================
// COMBINED SETTINGS STATE
// =============================================================================

interface SettingsState {
  postLoad: PostLoadSettings;
  submitComment: SubmitCommentSettings;
  commentGenerate: CommentGenerateSettings;
  behavior: BehaviorSettings;
}

interface SettingsActions {
  /** Update a post load filter setting */
  updatePostLoad: <K extends keyof PostLoadSettings>(
    key: K,
    value: PostLoadSettings[K],
  ) => void;

  /** Update a submit comment action setting */
  updateSubmitComment: <K extends keyof SubmitCommentSettings>(
    key: K,
    value: SubmitCommentSettings[K],
  ) => void;

  /** Update a comment generation setting */
  updateCommentGenerate: <K extends keyof CommentGenerateSettings>(
    key: K,
    value: CommentGenerateSettings[K],
  ) => void;

  /** Update a behavior/UI setting */
  updateBehavior: <K extends keyof BehaviorSettings>(
    key: K,
    value: BehaviorSettings[K],
  ) => void;

  /** Get array of tag strings for active (non-default) settings */
  getActiveSettingsTags: () => string[];

  /** Reset all settings to defaults */
  resetToDefaults: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

/**
 * Generate human-readable tags for active settings.
 * Only returns tags for settings that differ from defaults.
 */
function generateSettingsTags(state: SettingsState): string[] {
  const tags: string[] = [];

  // Behavior settings
  if (state.behavior.humanOnlyMode) {
    tags.push("Human Mode");
  }
  if (state.behavior.autoEngageOnCommentClick) {
    tags.push("Auto-engage");
  }
  if (state.behavior.spacebarAutoEngage) {
    tags.push("Space Engage");
  }
  if (state.behavior.postNavigator) {
    tags.push("Navigator");
  }

  // Post load filters
  if (state.postLoad.timeFilterEnabled && state.postLoad.minPostAge) {
    tags.push(`Max ${state.postLoad.minPostAge}h`);
  }
  if (state.postLoad.skipPromotedPostsEnabled) {
    tags.push("Skip Promoted");
  }
  if (state.postLoad.skipCompanyPagesEnabled) {
    tags.push("Skip Company");
  }
  if (state.postLoad.skipFriendActivitiesEnabled) {
    tags.push("Skip Friend Activity");
  }
  if (state.postLoad.skipFirstDegree) {
    tags.push("Skip 1st");
  }
  if (state.postLoad.skipSecondDegree) {
    tags.push("Skip 2nd");
  }
  if (state.postLoad.skipThirdDegree) {
    tags.push("Skip 3rd+");
  }
  if (state.postLoad.skipFollowing) {
    tags.push("Skip Following");
  }
  if (state.postLoad.skipBlacklistEnabled) {
    tags.push("Blacklist");
  }
  if (state.postLoad.targetListEnabled && state.postLoad.selectedTargetListId) {
    tags.push("Target List");
  }

  // Submit comment actions
  if (state.submitComment.likePostEnabled) {
    tags.push("Like Post");
  }
  if (state.submitComment.likeCommentEnabled) {
    tags.push("Like Comment");
  }
  if (state.submitComment.tagPostAuthorEnabled) {
    tags.push("Tag Author");
  }
  if (state.submitComment.attachPictureEnabled) {
    tags.push("Attach Image");
  }
  if (state.submitComment.submitDelayRange !== "5-20") {
    tags.push(`Delay ${state.submitComment.submitDelayRange}s`);
  }

  // Comment generate settings
  if (state.commentGenerate.adjacentCommentsEnabled) {
    tags.push("Adjacent Comments");
  }
  if (state.commentGenerate.dynamicChooseStyleEnabled) {
    tags.push("Dynamic Style");
  }
  if (state.commentGenerate.commentStyleId) {
    tags.push("Custom Style");
  }

  return tags;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Initial state - all defaults
  postLoad: { ...DEFAULT_POST_LOAD },
  submitComment: { ...DEFAULT_SUBMIT_COMMENT },
  commentGenerate: { ...DEFAULT_COMMENT_GENERATE },
  behavior: { ...DEFAULT_BEHAVIOR },

  // Actions
  updatePostLoad: (key, value) =>
    set((state) => ({
      postLoad: { ...state.postLoad, [key]: value },
    })),

  updateSubmitComment: (key, value) =>
    set((state) => ({
      submitComment: { ...state.submitComment, [key]: value },
    })),

  updateCommentGenerate: (key, value) =>
    set((state) => ({
      commentGenerate: { ...state.commentGenerate, [key]: value },
    })),

  updateBehavior: (key, value) =>
    set((state) => ({
      behavior: { ...state.behavior, [key]: value },
    })),

  getActiveSettingsTags: () => {
    const state = get();
    return generateSettingsTags(state);
  },

  resetToDefaults: () =>
    set({
      postLoad: { ...DEFAULT_POST_LOAD },
      submitComment: { ...DEFAULT_SUBMIT_COMMENT },
      commentGenerate: { ...DEFAULT_COMMENT_GENERATE },
      behavior: { ...DEFAULT_BEHAVIOR },
    }),
}));

// Export defaults for reference
export { DEFAULT_POST_LOAD, DEFAULT_SUBMIT_COMMENT, DEFAULT_COMMENT_GENERATE, DEFAULT_BEHAVIOR };
