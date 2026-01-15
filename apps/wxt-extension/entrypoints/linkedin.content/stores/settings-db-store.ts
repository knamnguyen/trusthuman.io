/**
 * DB Settings Store - Zustand store for DB-synced settings
 *
 * This store eagerly loads settings from tRPC when auth is confirmed,
 * similar to account-store pattern. Settings are account-specific and
 * synced to the database.
 *
 * Pattern:
 * 1. When auth state changes to signed in, immediately fetch settings
 * 2. Components can use this data without triggering their own fetches
 * 3. Updates are optimistic (update store immediately, then sync to DB)
 *
 * Three settings models:
 * - PostLoadSetting: Filters during "Load Posts" collection
 * - SubmitCommentSetting: Actions when submitting comments
 * - CommentGenerateSetting: AI generation options
 */

import { create } from "zustand";

import { getTrpcClient } from "../../../lib/trpc/client";

// =============================================================================
// TYPES
// =============================================================================

/**
 * PostLoadSetting - Filters during Load Posts
 * NOTE: Toggle and selection are independent (both stored in DB):
 * - targetListEnabled + targetListIds[] (target list feature)
 * - skipBlacklistEnabled + blacklistId (blacklist feature)
 *
 * NOTE: selectedTargetListUrns is runtime cache (fetched on-demand, not stored in DB)
 */
export interface PostLoadSettingDB {
  accountId: string;
  targetListEnabled: boolean;
  targetListIds: string[];

  timeFilterEnabled: boolean;
  minPostAge: number | null;

  skipFriendActivitiesEnabled: boolean;
  skipCompanyPagesEnabled: boolean;
  skipPromotedPostsEnabled: boolean;
  skipBlacklistEnabled: boolean;
  blacklistId: string | null;

  skipFirstDegree: boolean;
  skipSecondDegree: boolean;
  skipThirdDegree: boolean;
  skipFollowing: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * SubmitCommentSetting - Actions when submitting comments
 */
export interface SubmitCommentSettingDB {
  accountId: string;

  submitDelayRange: string;
  likePostEnabled: boolean;
  likeCommentEnabled: boolean;
  tagPostAuthorEnabled: boolean;
  attachPictureEnabled: boolean;
  defaultPictureAttachUrl: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * CommentGenerateSetting - AI generation options
 */
export interface CommentGenerateSettingDB {
  accountId: string;

  commentStyleId: string | null;
  dynamicChooseStyleEnabled: boolean;
  adjacentCommentsEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// DEFAULT VALUES (matches Prisma schema defaults)
// Used for optimistic updates when no settings exist yet
// =============================================================================

const DEFAULT_POST_LOAD: Omit<PostLoadSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  targetListEnabled: false,
  targetListIds: [],
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
};

const DEFAULT_SUBMIT_COMMENT: Omit<SubmitCommentSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  submitDelayRange: "5-20",
  likePostEnabled: false,
  likeCommentEnabled: false,
  tagPostAuthorEnabled: false,
  attachPictureEnabled: false,
  defaultPictureAttachUrl: null,
};

const DEFAULT_COMMENT_GENERATE: Omit<CommentGenerateSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  commentStyleId: null,
  dynamicChooseStyleEnabled: false,
  adjacentCommentsEnabled: false,
};

// =============================================================================
// STORE STATE
// =============================================================================

interface SettingsDBState {
  // Settings data
  postLoad: PostLoadSettingDB | null;
  submitComment: SubmitCommentSettingDB | null;
  commentGenerate: CommentGenerateSettingDB | null;

  // Loading states
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Last fetch timestamp for cache invalidation
  lastFetchedAt: number | null;
}

interface SettingsDBActions {
  /**
   * Fetch all three settings from tRPC
   * Called when auth state confirms user is signed in
   */
  fetchSettings: () => Promise<void>;

  /**
   * Update PostLoadSetting (optimistic + sync to DB)
   */
  updatePostLoad: (data: Partial<Omit<PostLoadSettingDB, "accountId" | "createdAt" | "updatedAt">>) => Promise<void>;

  /**
   * Update SubmitCommentSetting (optimistic + sync to DB)
   */
  updateSubmitComment: (data: Partial<Omit<SubmitCommentSettingDB, "accountId" | "createdAt" | "updatedAt">>) => Promise<void>;

  /**
   * Update CommentGenerateSetting (optimistic + sync to DB)
   */
  updateCommentGenerate: (data: Partial<Omit<CommentGenerateSettingDB, "accountId" | "createdAt" | "updatedAt">>) => Promise<void>;

  /**
   * Clear all settings (on sign out)
   */
  clear: () => void;
}

type SettingsDBStore = SettingsDBState & SettingsDBActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: SettingsDBState = {
  postLoad: null,
  submitComment: null,
  commentGenerate: null,
  isLoading: false,
  isLoaded: false,
  error: null,
  lastFetchedAt: null,
};

// =============================================================================
// STORE
// =============================================================================

export const useSettingsDBStore = create<SettingsDBStore>((set, get) => ({
  ...initialState,

  fetchSettings: async () => {
    // Skip if already loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const trpc = getTrpcClient();

      // Fetch all three settings in parallel
      const [postLoad, submitComment, commentGenerate] = await Promise.all([
        trpc.settings.postLoad.get.query(),
        trpc.settings.submitComment.get.query(),
        trpc.settings.commentGenerate.get.query(),
      ]);

      console.log("SettingsDBStore: Fetched settings", {
        postLoad: !!postLoad,
        submitComment: !!submitComment,
        commentGenerate: !!commentGenerate,
      });

      set({
        postLoad,
        submitComment,
        commentGenerate,
        isLoading: false,
        isLoaded: true,
        error: null,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      console.error("SettingsDBStore: Error fetching settings", error);

      set({
        isLoading: false,
        isLoaded: true,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch settings",
      });
    }
  },

  updatePostLoad: async (data) => {
    const currentPostLoad = get().postLoad;

    // Always do optimistic update (use defaults if no settings exist yet)
    const optimisticValue = {
      ...(currentPostLoad ?? {
        ...DEFAULT_POST_LOAD,
        accountId: "", // Will be set by server
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      ...data,
      updatedAt: new Date(),
    } as PostLoadSettingDB;

    set({ postLoad: optimisticValue });

    try {
      const trpc = getTrpcClient();
      const updated = await trpc.settings.postLoad.upsert.mutate(data) as PostLoadSettingDB;

      // Only update if the optimistic value hasn't been changed by another update
      // This prevents race conditions when user clicks rapidly
      const latestPostLoad = get().postLoad;
      if (latestPostLoad?.updatedAt.getTime() === optimisticValue.updatedAt.getTime()) {
        set({ postLoad: updated });
      }

      console.log("SettingsDBStore: Updated postLoad setting", data);
    } catch (error) {
      console.error("SettingsDBStore: Error updating postLoad", error);

      // Revert to previous value on error (only if not changed by another update)
      const latestPostLoad = get().postLoad;
      if (latestPostLoad?.updatedAt.getTime() === optimisticValue.updatedAt.getTime()) {
        set({ postLoad: currentPostLoad });
      }

      throw error;
    }
  },

  updateSubmitComment: async (data) => {
    const currentSubmitComment = get().submitComment;

    // Always do optimistic update (use defaults if no settings exist yet)
    const optimisticValue = {
      ...(currentSubmitComment ?? {
        ...DEFAULT_SUBMIT_COMMENT,
        accountId: "", // Will be set by server
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      ...data,
      updatedAt: new Date(),
    } as SubmitCommentSettingDB;

    set({ submitComment: optimisticValue });

    try {
      const trpc = getTrpcClient();
      const updated = await trpc.settings.submitComment.upsert.mutate(data) as SubmitCommentSettingDB;

      // Only update if the optimistic value hasn't been changed by another update
      const latestSubmitComment = get().submitComment;
      if (latestSubmitComment?.updatedAt.getTime() === optimisticValue.updatedAt.getTime()) {
        set({ submitComment: updated });
      }

      console.log("SettingsDBStore: Updated submitComment setting", data);
    } catch (error) {
      console.error("SettingsDBStore: Error updating submitComment", error);

      // Revert to previous value on error (only if not changed by another update)
      const latestSubmitComment = get().submitComment;
      if (latestSubmitComment?.updatedAt.getTime() === optimisticValue.updatedAt.getTime()) {
        set({ submitComment: currentSubmitComment });
      }

      throw error;
    }
  },

  updateCommentGenerate: async (data) => {
    const currentCommentGenerate = get().commentGenerate;

    // Always do optimistic update (use defaults if no settings exist yet)
    const optimisticValue = {
      ...(currentCommentGenerate ?? {
        ...DEFAULT_COMMENT_GENERATE,
        accountId: "", // Will be set by server
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      ...data,
      updatedAt: new Date(),
    } as CommentGenerateSettingDB;

    set({ commentGenerate: optimisticValue });

    try {
      const trpc = getTrpcClient();
      const updated = await trpc.settings.commentGenerate.upsert.mutate(data) as CommentGenerateSettingDB;

      // Only update if the optimistic value hasn't been changed by another update
      const latestCommentGenerate = get().commentGenerate;
      if (latestCommentGenerate?.updatedAt.getTime() === optimisticValue.updatedAt.getTime()) {
        set({ commentGenerate: updated });
      }

      console.log("SettingsDBStore: Updated commentGenerate setting", data);
    } catch (error) {
      console.error("SettingsDBStore: Error updating commentGenerate", error);

      // Revert to previous value on error (only if not changed by another update)
      const latestCommentGenerate = get().commentGenerate;
      if (latestCommentGenerate?.updatedAt.getTime() === optimisticValue.updatedAt.getTime()) {
        set({ commentGenerate: currentCommentGenerate });
      }

      throw error;
    }
  },

  clear: () => {
    set(initialState);
  },
}));

// =============================================================================
// LISTENER INITIALIZATION
// =============================================================================

/**
 * Initialize settings data fetching when an account is selected
 * Settings are account-specific, so we must wait for matchingAccount to be populated
 * Call this from the content script initialization
 *
 * @param accountStore - Pass the account store to avoid circular dependency
 */
export function initSettingsDBStoreListener(accountStore?: {
  subscribe: (callback: (state: { matchingAccount: { id: string } | null; isLoaded: boolean }) => void) => () => void;
}) {
  let unsubscribe: (() => void) | undefined;

  // Subscribe to account store changes if provided
  if (accountStore) {
    unsubscribe = accountStore.subscribe(
      (state: { matchingAccount: { id: string } | null; isLoaded: boolean }) => {
        const settingsStore = useSettingsDBStore.getState();

        // Only fetch if:
        // 1. Account store is loaded
        // 2. We have a matching account (user is on a registered LinkedIn)
        // 3. Settings haven't been fetched yet
        if (state.isLoaded && state.matchingAccount && !settingsStore.isLoaded && !settingsStore.isLoading) {
          console.log("SettingsDBStore: Account selected, fetching settings for", state.matchingAccount.id);
          settingsStore.fetchSettings();
        }

        // Clear settings if no matching account (user signed out or on unregistered LinkedIn)
        if (state.isLoaded && !state.matchingAccount && settingsStore.isLoaded) {
          console.log("SettingsDBStore: No matching account, clearing settings");
          settingsStore.clear();
        }
      }
    );
  }

  // Also listen for explicit sign out messages
  const listener = (message: { action: string; isSignedIn?: boolean }) => {
    if (message.action === "authStateChanged" && !message.isSignedIn) {
      console.log("SettingsDBStore: User signed out, clearing settings");
      useSettingsDBStore.getState().clear();
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    unsubscribe?.();
    chrome.runtime.onMessage.removeListener(listener);
  };
}
