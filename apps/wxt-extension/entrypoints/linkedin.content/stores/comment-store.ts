import { create } from "zustand";

/**
 * Comment store - manages AI-generated comment state only
 * Sidebar UI state is in sidebar-store.ts
 */
interface CommentState {
  // Array of generated comments (1 for normal, 3 for variations mode)
  comments: string[];
  // Whether AI is currently generating
  isGenerating: boolean;
  // The post content used to generate the comment (for display purposes)
  postContent: string | null;
  // Setting: generate 3 variations instead of 1
  generateVariations: boolean;
}

interface CommentActions {
  setComments: (comments: string[]) => void;
  addComment: (comment: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setPostContent: (content: string | null) => void;
  setGenerateVariations: (enabled: boolean) => void;
  clear: () => void;
}

type CommentStore = CommentState & CommentActions;

export const useCommentStore = create<CommentStore>((set) => ({
  // Initial state
  comments: [],
  isGenerating: false,
  postContent: null,
  generateVariations: false,

  // Actions
  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setPostContent: (postContent) => set({ postContent }),
  setGenerateVariations: (generateVariations) => set({ generateVariations }),
  clear: () => set({ comments: [], isGenerating: false, postContent: null }),
}));
