import { create } from "zustand";

import type { ProfileInfo } from "../save-profile/extract-profile-info";

export interface CommentData {
  author: string | null;
  content: string | null;
  time: number | null;
  postAuthor: string | null;
  parentCommentAuthor: string | null;
  isReply: boolean;
  entityUrn: string;
  parentUrn: string | null;
  /** Direct link to the activity/post */
  activityUrl: string | null;
  /** Comment author's profile picture URL */
  authorPhotoUrl: string | null;
  /** Comment author's profile URL */
  authorProfileUrl: string | null;
  /** Post author's profile picture URL */
  postAuthorPhotoUrl: string | null;
  /** Post author's profile URL */
  postAuthorProfileUrl: string | null;
}

export interface CommentStats {
  /** Total comments made by this author */
  total: number;
  /** Comments on author's own posts */
  onOwnPosts: number;
  /** Comments on others' posts */
  onOthersPosts: number;
  /** Time range in days */
  timeRangeDays: number;
  /** Oldest comment timestamp */
  oldestTime: number | null;
  /** Newest comment timestamp */
  newestTime: number | null;
}

export interface PostAuthorRanking {
  /** Post author name */
  postAuthor: string;
  /** Number of comments on this author's posts */
  count: number;
  /** Individual comments on this author's posts */
  comments: CommentData[];
}

interface SavedProfileState {
  /** Profile info extracted from DOM */
  selectedProfile: ProfileInfo | null;
  /** All comments by the selected profile author */
  authorComments: CommentData[];
  /** Computed statistics */
  commentStats: CommentStats | null;
  /** Ranked list of post authors (most commented on first) */
  postAuthorRankings: PostAuthorRanking[];
  /** Loading state for comments fetch */
  isLoadingComments: boolean;
}

interface SavedProfileActions {
  setSelectedProfile: (profile: ProfileInfo | null) => void;
  /** Process raw comments and compute stats/rankings for the profile author */
  processComments: (
    allComments: CommentData[],
    profileName: string | null,
  ) => void;
  setIsLoadingComments: (loading: boolean) => void;
  clearAll: () => void;
}

type SavedProfileStore = SavedProfileState & SavedProfileActions;

/**
 * Computes statistics and rankings from comments made by the profile author
 */
function computeStatsAndRankings(
  authorComments: CommentData[],
  profileName: string | null,
): { stats: CommentStats; rankings: PostAuthorRanking[] } {
  // Calculate time range
  let oldestTime: number | null = null;
  let newestTime: number | null = null;

  for (const c of authorComments) {
    if (typeof c.time === "number") {
      if (oldestTime === null || c.time < oldestTime) oldestTime = c.time;
      if (newestTime === null || c.time > newestTime) newestTime = c.time;
    }
  }

  const timeRangeDays =
    oldestTime && newestTime
      ? Math.ceil((newestTime - oldestTime) / (24 * 60 * 60 * 1000))
      : 0;

  // Separate own posts vs others' posts
  const onOwnPosts = authorComments.filter(
    (c) =>
      c.postAuthor &&
      profileName &&
      c.postAuthor.toLowerCase().includes(profileName.toLowerCase()),
  );

  const onOthersPosts = authorComments.filter(
    (c) =>
      c.postAuthor &&
      profileName &&
      !c.postAuthor.toLowerCase().includes(profileName.toLowerCase()),
  );

  const stats: CommentStats = {
    total: authorComments.length,
    onOwnPosts: onOwnPosts.length,
    onOthersPosts: onOthersPosts.length,
    timeRangeDays,
    oldestTime,
    newestTime,
  };

  // Build ranking of post authors (only from others' posts)
  const postAuthorMap = new Map<string, CommentData[]>();

  for (const comment of onOthersPosts) {
    if (comment.postAuthor) {
      const existing = postAuthorMap.get(comment.postAuthor) || [];
      existing.push(comment);
      postAuthorMap.set(comment.postAuthor, existing);
    }
  }

  // Convert to sorted array (most comments first)
  const rankings: PostAuthorRanking[] = Array.from(postAuthorMap.entries())
    .map(([postAuthor, comments]) => ({
      postAuthor,
      count: comments.length,
      comments: comments.sort((a, b) => (b.time || 0) - (a.time || 0)),
    }))
    .sort((a, b) => b.count - a.count);

  return { stats, rankings };
}

export const useSavedProfileStore = create<SavedProfileStore>((set) => ({
  selectedProfile: null,
  authorComments: [],
  commentStats: null,
  postAuthorRankings: [],
  isLoadingComments: false,

  setSelectedProfile: (profile) =>
    set({
      selectedProfile: profile,
      authorComments: [],
      commentStats: null,
      postAuthorRankings: [],
    }),

  processComments: (allComments, profileName) => {
    if (!profileName) {
      set({
        authorComments: [],
        commentStats: null,
        postAuthorRankings: [],
      });
      return;
    }

    console.log("🔍 Processing comments:", {
      totalComments: allComments.length,
      profileName,
      sampleAuthors: allComments.slice(0, 5).map(c => c.author),
    });

    // Filter to only comments by this author
    const authorComments = allComments.filter(
      (c) =>
        c.author &&
        c.author.toLowerCase().includes(profileName.toLowerCase()),
    );

    console.log("✅ Filtered comments:", {
      matchedCount: authorComments.length,
      profileNameLower: profileName.toLowerCase(),
    });

    const { stats, rankings } = computeStatsAndRankings(
      authorComments,
      profileName,
    );

    set({
      authorComments,
      commentStats: stats,
      postAuthorRankings: rankings,
    });
  },

  setIsLoadingComments: (loading) => set({ isLoadingComments: loading }),

  clearAll: () =>
    set({
      selectedProfile: null,
      authorComments: [],
      commentStats: null,
      postAuthorRankings: [],
      isLoadingComments: false,
    }),
}));
