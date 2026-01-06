import { create } from "zustand";

import type { PostAuthorInfo } from "../utils/post/extract-author-info-from-post";
import type { PostCommentInfo } from "../utils/post/extract-comment-from-post";
import type { PostTimeInfo } from "../utils/post/extract-post-time";
import type { PostUrlInfo } from "../utils/post/extract-post-url";

// Separate settings type for localStorage persistence
export interface ComposeSettings {
  /** 100% human mode - only create empty card, no AI generation */
  humanOnlyMode: boolean;
  /** Auto-trigger generation when user clicks LinkedIn's comment button */
  autoEngageOnCommentClick: boolean;
  /** Highlight most visible post and trigger engage on spacebar press */
  spacebarAutoEngage: boolean;
  /** Show floating post navigator UI for quick scrolling between posts */
  postNavigator: boolean;
}

// localStorage key for persisting settings
const SETTINGS_STORAGE_KEY = "engagekit-compose-settings";

// Default settings
const DEFAULT_SETTINGS: ComposeSettings = {
  humanOnlyMode: false,
  autoEngageOnCommentClick: false,
  spacebarAutoEngage: false,
  postNavigator: false,
};

/**
 * Load settings from localStorage, falling back to defaults
 */
function loadSettings(): ComposeSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ComposeSettings>;
      // Merge with defaults to handle missing keys from older versions
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn(
      "[ComposeStore] Failed to load settings from localStorage:",
      error,
    );
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: ComposeSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn(
      "[ComposeStore] Failed to save settings to localStorage:",
      error,
    );
  }
}

/**
 * Represents a single compose card with reference to the LinkedIn post
 */
export interface ComposeCard {
  id: string;
  /** First 10 words of post caption as preview */
  captionPreview: string;
  /** Full post caption text */
  fullCaption: string;
  /** The editable comment text */
  commentText: string;
  /** The original AI-generated comment text (for calculating "Your Touch" score) */
  originalCommentText: string;
  /** Reference to the post container element */
  postContainer: HTMLElement;
  /** Post URN for identification */
  urn: string;
  /** Status of this card */
  status: "draft" | "sent";
  /** Whether AI is currently generating a comment for this card */
  isGenerating: boolean;
  /** Pre-extracted author info (name, photo, headline, profileUrl) */
  authorInfo: PostAuthorInfo | null;
  /** Pre-extracted post time (displayTime, fullTime) */
  postTime: PostTimeInfo | null;
  /** Pre-extracted post URL info (urn, url) - array to handle aggregate posts */
  postUrls: PostUrlInfo[];
  /** Pre-loaded comments on this post */
  comments: PostCommentInfo[];
}

interface ComposeState {
  /** All compose cards */
  cards: ComposeCard[];
  /** Whether we're currently collecting posts (Load Posts running) */
  isCollecting: boolean;
  /** Whether we're currently submitting comments */
  isSubmitting: boolean;
  /** Whether EngageButton is currently generating (single post, 3 variations) */
  isEngageButtonGenerating: boolean;
  /**
   * URNs of posts that user has explicitly removed/ignored.
   * These will NOT be re-added when clicking "Compose" again.
   * This allows users to skip posts they don't want to comment on.
   */
  ignoredUrns: Set<string>;
  /** ID of the card currently being previewed (null if none) */
  previewingCardId: string | null;
  /** Whether user is currently focused on a textarea (pauses collection) */
  isUserEditing: boolean;
  /** IDs of cards from single-post generation (EngageButton/comment click) */
  singlePostCardIds: string[];
  /** Settings for compose behavior */
  settings: ComposeSettings;
}

interface ComposeActions {
  /** Add a new card */
  addCard: (card: ComposeCard) => void;
  /** Update a card's comment text */
  updateCardText: (id: string, text: string) => void;
  /** Update a card's status */
  updateCardStatus: (id: string, status: "draft" | "sent") => void;
  /** Update a card's comment and mark generation complete */
  updateCardComment: (id: string, comment: string) => void;
  /** Set a card's generating state (for regeneration) */
  setCardGenerating: (id: string, isGenerating: boolean) => void;
  /**
   * Remove a card and add its URN to ignored list.
   * The post will not reappear when composing again.
   */
  removeCard: (id: string) => void;
  /** Set collecting state */
  setIsCollecting: (isCollecting: boolean) => void;
  /** Set submitting state */
  setIsSubmitting: (isSubmitting: boolean) => void;
  /** Check if a URN is ignored */
  isUrnIgnored: (urn: string) => boolean;
  /** Set the card being previewed (null to close preview) */
  setPreviewingCard: (cardId: string | null) => void;
  /** Set whether user is editing (focused on textarea) */
  setIsUserEditing: (isEditing: boolean) => void;
  /** Set EngageButton generating state */
  setIsEngageButtonGenerating: (isGenerating: boolean) => void;
  /** Set single-post card IDs (from EngageButton/comment click) */
  setSinglePostCards: (ids: string[]) => void;
  /** Remove a single-post card (doesn't add to ignoredUrns) */
  removeSinglePostCard: (id: string) => void;
  /** Clear all single-post cards (for fresh generation on new post click) */
  clearSinglePostCards: () => void;
  /**
   * Update comments for all cards with matching URN.
   * Used by single-post mode (EngageButton/AutoEngageObserver) where cards are created
   * INSTANTLY for fast UX, then comments are loaded async and need to be added later.
   * Not needed by Load Posts mode which extracts comments at card creation time.
   */
  updateCardsComments: (urn: string, comments: PostCommentInfo[]) => void;
  /** Update a setting (persists to localStorage) */
  updateSetting: <K extends keyof ComposeSettings>(
    key: K,
    value: ComposeSettings[K],
  ) => void;
  /** Clear all cards and reset all generating/collecting states */
  clearAllCards: () => void;
}

type ComposeStore = ComposeState & ComposeActions;

export const useComposeStore = create<ComposeStore>((set, get) => ({
  // Initial state
  cards: [],
  isCollecting: false,
  isSubmitting: false,
  isEngageButtonGenerating: false,
  ignoredUrns: new Set<string>(),
  previewingCardId: null,
  isUserEditing: false,
  singlePostCardIds: [],
  settings: loadSettings(),

  // Actions
  addCard: (card) => {
    console.log("[ComposeStore] addCard:", card.id.slice(0, 8));
    set((state) => ({
      cards: [...state.cards, card],
    }));
  },

  updateCardText: (id, text) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, commentText: text } : card,
      ),
    }));
  },

  updateCardStatus: (id, status) =>
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, status } : card,
      ),
    })),

  updateCardComment: (id, comment) => {
    console.log(
      "[ComposeStore] updateCardComment:",
      id.slice(0, 8),
      "comment length:",
      comment.length,
    );
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id
          ? {
              ...card,
              commentText: comment,
              originalCommentText: comment,
              isGenerating: false,
            }
          : card,
      ),
    }));
  },

  setCardGenerating: (id, isGenerating) => {
    console.log(
      "[ComposeStore] setCardGenerating:",
      id.slice(0, 8),
      isGenerating,
    );
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, isGenerating } : card,
      ),
    }));
  },

  /**
   * Remove card and mark its URN as ignored.
   * This prevents the post from being re-added when clicking "Compose" again.
   */
  removeCard: (id) =>
    set((state) => {
      const cardToRemove = state.cards.find((card) => card.id === id);
      const newIgnoredUrns = new Set(state.ignoredUrns);
      if (cardToRemove) {
        newIgnoredUrns.add(cardToRemove.urn);
      }
      return {
        cards: state.cards.filter((card) => card.id !== id),
        ignoredUrns: newIgnoredUrns,
      };
    }),

  setIsCollecting: (isCollecting) => set({ isCollecting }),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  /** Check if a URN is in the ignored list */
  isUrnIgnored: (urn) => get().ignoredUrns.has(urn),

  /** Set the card being previewed */
  setPreviewingCard: (cardId) => set({ previewingCardId: cardId }),

  /** Set whether user is editing (focused on textarea) */
  setIsUserEditing: (isEditing) => set({ isUserEditing: isEditing }),

  /** Set EngageButton generating state */
  setIsEngageButtonGenerating: (isGenerating) =>
    set({ isEngageButtonGenerating: isGenerating }),

  /** Set single-post card IDs (from EngageButton/comment click) */
  setSinglePostCards: (ids) => set({ singlePostCardIds: ids }),

  /** Remove a single-post card (doesn't add to ignoredUrns like removeCard does) */
  removeSinglePostCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
      singlePostCardIds: state.singlePostCardIds.filter((cid) => cid !== id),
    })),

  /** Clear all single-post cards (for fresh generation when clicking a new post) */
  clearSinglePostCards: () =>
    set((state) => ({
      cards: state.cards.filter((c) => !state.singlePostCardIds.includes(c.id)),
      singlePostCardIds: [],
      isEngageButtonGenerating: false,
      previewingCardId: null,
    })),

  /**
   * Update comments for all cards with matching URN.
   * Single-post mode creates cards instantly (comments: []) for fast UX,
   * then loads comments async and updates via this action.
   */
  updateCardsComments: (urn, comments) => {
    console.log(
      "[ComposeStore] updateCardsComments:",
      urn.slice(0, 20),
      "comments:",
      comments.length,
    );
    set((state) => ({
      cards: state.cards.map((card) =>
        card.urn === urn ? { ...card, comments } : card,
      ),
    }));
  },

  /** Update a setting and persist to localStorage */
  updateSetting: (key, value) =>
    set((state) => {
      const newSettings = { ...state.settings, [key]: value };
      saveSettings(newSettings);
      return { settings: newSettings };
    }),

  /** Clear all cards and reset all generating/collecting states */
  clearAllCards: () =>
    set({
      cards: [],
      singlePostCardIds: [],
      isCollecting: false,
      isEngageButtonGenerating: false,
      isSubmitting: false,
      previewingCardId: null,
      // Note: ignoredUrns is NOT cleared - user's dismissals persist
    }),
}));
