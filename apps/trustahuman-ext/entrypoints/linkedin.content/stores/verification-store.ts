import { create } from "zustand";

export type ActivityType = "linkedin_comment" | "linkedin_post" | "x_reply" | "x_post" | "facebook_comment" | "threads_comment" | "reddit_comment" | "ph_comment" | "github_comment" | "hn_comment";
export type Platform = "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";

export interface VerifiedActivity {
  id: string;
  timestamp: Date;
  action: ActivityType;
  platform: Platform;
  verified: boolean;
  confidence: number;
  faceCount: number;

  // Standardized activity data (for all platforms)
  commentText?: string;
  commentUrl?: string; // Direct URL to the comment (optional)
  parentUrl?: string; // Link to parent post (fallback if no commentUrl)
  parentAuthorName?: string;
  parentAuthorAvatarUrl?: string;
  parentTextSnippet?: string;

  // Note: photoBase64 is NOT stored - photo is deleted after verification for privacy
}

// Backwards compatibility alias
export type VerifiedComment = VerifiedActivity;

interface VerificationStore {
  verifications: VerifiedActivity[];
  isRecording: boolean;
  addVerification: (v: VerifiedActivity) => void;
  setRecording: (r: boolean) => void;
}

export const useVerificationStore = create<VerificationStore>((set) => ({
  verifications: [],
  isRecording: true,
  addVerification: (v) =>
    set((state) => ({
      verifications: [v, ...state.verifications],
    })),
  setRecording: (isRecording) => set({ isRecording }),
}));
