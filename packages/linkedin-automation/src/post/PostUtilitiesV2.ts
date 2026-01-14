import type {
  AdjacentCommentInfo,
  ConnectionDegree,
  PostAuthorInfo,
  PostCommentInfo,
  PostTimeInfo,
  PostUrlInfo,
  PostUtilities,
} from "./types";
import { detectCompanyPost } from "./utils-v2/detect-company-post";
import { detectConnectionDegree } from "./utils-v2/detect-connection-degree";
import { detectFriendActivity } from "./utils-v2/detect-friend-activity";
import { detectPromotedPost } from "./utils-v2/detect-promoted-post";
import { extractAdjacentComments } from "./utils-v2/extract-adjacent-comments";
import { extractPostAuthorInfo } from "./utils-v2/extract-post-author-info";
import { extractPostCaption } from "./utils-v2/extract-post-caption";
import { extractPostComments } from "./utils-v2/extract-post-comments";
import { extractPostTime } from "./utils-v2/extract-post-time";
import { extractPostUrl } from "./utils-v2/extract-post-url";
import { findPostContainer } from "./utils-v2/find-post-container";

export class PostUtilitiesV2 implements PostUtilities {
  findPostContainer(anchorElement: Element): Element | null {
    return findPostContainer(anchorElement);
  }

  extractPostUrl(postContainer: HTMLElement): PostUrlInfo[] {
    return extractPostUrl(postContainer);
  }

  extractPostAuthorInfo(postContainer: HTMLElement): PostAuthorInfo {
    return extractPostAuthorInfo(postContainer);
  }

  extractPostCaption(postContainer: Element): string {
    return extractPostCaption(postContainer);
  }

  extractPostTime(postContainer: HTMLElement): PostTimeInfo {
    return extractPostTime(postContainer);
  }

  detectCompanyPost(postContainer: HTMLElement): boolean {
    return detectCompanyPost(postContainer);
  }

  detectPromotedPost(postContainer: HTMLElement): boolean {
    return detectPromotedPost(postContainer);
  }

  detectConnectionDegree(postContainer: HTMLElement): ConnectionDegree {
    return detectConnectionDegree(postContainer);
  }

  detectFriendActivity(postContainer: HTMLElement): boolean {
    return detectFriendActivity(postContainer);
  }

  extractPostComments(postContainer: HTMLElement): PostCommentInfo[] {
    return extractPostComments(postContainer);
  }

  extractAdjacentComments(postContainer: HTMLElement): AdjacentCommentInfo[] {
    return extractAdjacentComments(postContainer);
  }

  getPostContainerSelector(): string {
    return 'div[role="listitem"]';
  }
}
