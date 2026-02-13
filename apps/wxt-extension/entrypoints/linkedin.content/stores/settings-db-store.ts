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

import type {
  PostLoadSetting,
  SubmitCommentSetting,
  CommentGenerateSetting,
  PostLoadSettingsPartial,
  CommentGenerateSettingsPartial,
} from "@sassy/db/schema-validators";

import { getTrpcClient } from "../../../lib/trpc/client";
import { prefetchBlacklist } from "./blacklist-cache";
import { prefetchCommentStyle } from "./comment-style-cache";
import { prefetchUrnsForLists } from "./queue";

// =============================================================================
// TYPES
// =============================================================================

export type PostLoadSettingDB = PostLoadSetting;
export type SubmitCommentSettingDB = SubmitCommentSetting;
export type CommentGenerateSettingDB = CommentGenerateSetting;

// =============================================================================
// DEFAULT VALUES (matches Prisma @default values)
// TypeScript will error if a field is missing after db:generate
// =============================================================================

const DEFAULT_POST_LOAD: PostLoadSettingsPartial = {
  targetListEnabled: false,
  targetListIds: [],
  discoverySetEnabled: false,
  discoverySetIds: [],
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
  skipCommentsLoading: true,
  skipIfUserCommented: false,
};

const DEFAULT_SUBMIT_COMMENT: Omit<SubmitCommentSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  submitDelayRange: "5-20",
  likePostEnabled: false,
  likeCommentEnabled: false,
  tagPostAuthorEnabled: false,
  attachPictureEnabled: false,
  defaultPictureAttachUrl: null,
};

const DEFAULT_COMMENT_GENERATE: CommentGenerateSettingsPartial = {
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
  updatePostLoad: (
    data: Partial<
      Omit<PostLoadSettingDB, "accountId" | "createdAt" | "updatedAt">
    >,
  ) => Promise<void>;

  /**
   * Update SubmitCommentSetting (optimistic + sync to DB)
   */
  updateSubmitComment: (
    data: Partial<
      Omit<SubmitCommentSettingDB, "accountId" | "createdAt" | "updatedAt">
    >,
  ) => Promise<void>;

  /**
   * Update CommentGenerateSetting (optimistic + sync to DB)
   */
  updateCommentGenerate: (
    data: Partial<
      Omit<CommentGenerateSettingDB, "accountId" | "createdAt" | "updatedAt">
    >,
  ) => Promise<void>;

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

      // Pre-fetch URNs for selected target lists (fire-and-forget)
      // This warms the cache so "Load Posts" is instant
      if (postLoad?.targetListIds?.length) {
        console.log(
          "SettingsDBStore: Pre-fetching URNs for saved target lists...",
        );
        void prefetchUrnsForLists(postLoad.targetListIds);
      }

      // Pre-fetch blacklist profile URLs (fire-and-forget)
      // This warms the cache so blacklist filtering is instant
      if (postLoad?.skipBlacklistEnabled && postLoad?.blacklistId) {
        console.log("SettingsDBStore: Pre-fetching blacklist profiles...");
        void prefetchBlacklist(postLoad.blacklistId);
      }

      // Pre-fetch selected comment style (fire-and-forget)
      // This warms the cache so AI generation is instant
      if (commentGenerate?.commentStyleId) {
        console.log("SettingsDBStore: Pre-fetching comment style...");
        void prefetchCommentStyle();
      }
    } catch (error) {
      console.error("SettingsDBStore: Error fetching settings", error);

      set({
        isLoading: false,
        isLoaded: true,
        error:
          error instanceof Error ? error.message : "Failed to fetch settings",
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
      const updated = (await trpc.settings.postLoad.upsert.mutate(
        data,
      )) as PostLoadSettingDB;

      // Only update if the optimistic value hasn't been changed by another update
      // This prevents race conditions when user clicks rapidly
      const latestPostLoad = get().postLoad;
      if (
        latestPostLoad?.updatedAt.getTime() ===
        optimisticValue.updatedAt.getTime()
      ) {
        set({ postLoad: updated });
      }

      console.log("SettingsDBStore: Updated postLoad setting", data);
    } catch (error) {
      console.error("SettingsDBStore: Error updating postLoad", error);

      // Revert to previous value on error (only if not changed by another update)
      const latestPostLoad = get().postLoad;
      if (
        latestPostLoad?.updatedAt.getTime() ===
        optimisticValue.updatedAt.getTime()
      ) {
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
      const updated = (await trpc.settings.submitComment.upsert.mutate(
        data,
      )) as SubmitCommentSettingDB;

      // Only update if the optimistic value hasn't been changed by another update
      const latestSubmitComment = get().submitComment;
      if (
        latestSubmitComment?.updatedAt.getTime() ===
        optimisticValue.updatedAt.getTime()
      ) {
        set({ submitComment: updated });
      }

      console.log("SettingsDBStore: Updated submitComment setting", data);
    } catch (error) {
      console.error("SettingsDBStore: Error updating submitComment", error);

      // Revert to previous value on error (only if not changed by another update)
      const latestSubmitComment = get().submitComment;
      if (
        latestSubmitComment?.updatedAt.getTime() ===
        optimisticValue.updatedAt.getTime()
      ) {
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
      const updated = (await trpc.settings.commentGenerate.upsert.mutate(
        data,
      )) as CommentGenerateSettingDB;

      // Only update if the optimistic value hasn't been changed by another update
      const latestCommentGenerate = get().commentGenerate;
      if (
        latestCommentGenerate?.updatedAt.getTime() ===
        optimisticValue.updatedAt.getTime()
      ) {
        set({ commentGenerate: updated });
      }

      console.log("SettingsDBStore: Updated commentGenerate setting", data);
    } catch (error) {
      console.error("SettingsDBStore: Error updating commentGenerate", error);

      // Revert to previous value on error (only if not changed by another update)
      const latestCommentGenerate = get().commentGenerate;
      if (
        latestCommentGenerate?.updatedAt.getTime() ===
        optimisticValue.updatedAt.getTime()
      ) {
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
  subscribe: (
    callback: (state: {
      matchingAccount: { id: string } | null;
      isLoaded: boolean;
    }) => void,
  ) => () => void;
}) {
  let unsubscribe: (() => void) | undefined;

  // Subscribe to account store changes if provided
  if (accountStore) {
    unsubscribe = accountStore.subscribe(
      (state: {
        matchingAccount: { id: string } | null;
        isLoaded: boolean;
      }) => {
        const settingsStore = useSettingsDBStore.getState();

        // Only fetch if:
        // 1. Account store is loaded
        // 2. We have a matching account (user is on a registered LinkedIn)
        // 3. Settings haven't been fetched yet
        if (
          state.isLoaded &&
          state.matchingAccount &&
          !settingsStore.isLoaded &&
          !settingsStore.isLoading
        ) {
          console.log(
            "SettingsDBStore: Account selected, fetching settings for",
            state.matchingAccount.id,
          );
          settingsStore.fetchSettings();
        }

        // Clear settings if no matching account (user signed out or on unregistered LinkedIn)
        if (
          state.isLoaded &&
          !state.matchingAccount &&
          settingsStore.isLoaded
        ) {
          console.log(
            "SettingsDBStore: No matching account, clearing settings",
          );
          settingsStore.clear();
        }
      },
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
