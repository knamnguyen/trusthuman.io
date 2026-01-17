/**
 * Types for the History page components
 */

/** PostCommentInfo - Adjacent comment scraped from LinkedIn */
export interface PostCommentInfo {
  authorName: string | null;
  authorHeadline: string | null;
  authorProfileUrl: string | null;
  authorPhotoUrl: string | null;
  content: string | null;
  urn: string | null;
  isReply: boolean;
}

/** HistoryComment - Comment data from the listByAccount query */
export interface HistoryComment {
  id: string;
  postUrl: string;
  commentUrl: string | null;
  postFullCaption: string;
  postCreatedAt: Date | null;
  postComments: PostCommentInfo[] | null;
  comment: string;
  originalAiComment: string | null;
  commentedAt: Date | null;
  authorName: string | null;
  authorProfileUrl: string | null;
  authorAvatarUrl: string | null;
  authorHeadline: string | null;
  peakTouchScore: number | null;
}
