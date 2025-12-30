import { create } from "zustand";

import type { PostAuthorInfo } from "../utils/extract-author-info-from-post";
import type { PostCommentInfo } from "../utils/extract-comment-from-post";
import type { PostTimeInfo } from "../utils/extract-post-time";
import type { PostUrlInfo } from "../utils/extract-post-url";

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
  /** Pre-extracted post URL info (urn, url) */
  postUrl: PostUrlInfo | null;
  /** Pre-loaded comments on this post */
  comments: PostCommentInfo[];
}

interface ComposeState {
  /** All compose cards */
  cards: ComposeCard[];
  /** Whether we're currently collecting posts */
  isCollecting: boolean;
  /** Whether we're currently submitting comments */
  isSubmitting: boolean;
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
}

type ComposeStore = ComposeState & ComposeActions;

export const useComposeStore = create<ComposeStore>((set, get) => ({
  // Initial state
  cards: [],
  isCollecting: false,
  isSubmitting: false,
  ignoredUrns: new Set<string>(),
  previewingCardId: null,
  isUserEditing: false,

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
}));
