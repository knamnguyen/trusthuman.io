// Re-export from linkedin-automation (migrated utilities)
export { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
export { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
export type { PostUtilities } from "@sassy/linkedin-automation/post/types";
export type { CommentUtilities } from "@sassy/linkedin-automation/comment/types";
export type {
  PostUrlInfo,
  PostAuthorInfo,
  PostTimeInfo,
  PostCommentInfo,
  AdjacentCommentInfo,
} from "@sassy/linkedin-automation/post/types";

// Keep local utilities (not migrated)
export { attachImageToComment } from "./comment/attach-image-to-comment";
export { DEFAULT_STYLE_GUIDE } from "./constants";
export {
  navigateLinkedIn,
  createNavigateHandler,
  linkedInLinkProps,
} from "./linkedin-navigate";
export {
  useMostVisiblePost,
  DEFAULT_HIGHLIGHT_STYLE,
  type UseMostVisiblePostOptions,
  type UseMostVisiblePostResult,
} from "./feed/use-most-visible-post";
