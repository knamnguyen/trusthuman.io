import type {
  PostAuthorInfo,
  PostTimeInfo,
  PostUrlInfo,
  PostUtilities,
} from "./types";
import { findPostContainer } from "./utils-v1/find-post-container";
import { extractPostUrl } from "./utils-v1/extract-post-url";
import { extractAuthorInfo } from "./utils-v1/extract-author-info";
import { extractPostCaption } from "./utils-v1/extract-post-caption";
import { extractPostTime } from "./utils-v1/extract-post-time";
import { detectCompanyPost } from "./utils-v1/detect-company-post";
import { detectPromotedPost } from "./utils-v1/detect-promoted-post";

export class PostUtilitiesV1 implements PostUtilities {
  findPostContainer(anchorElement: Element): Element | null {
    return findPostContainer(anchorElement);
  }

  extractPostUrl(postContainer: HTMLElement): PostUrlInfo[] {
    return extractPostUrl(postContainer);
  }

  extractAuthorInfo(postContainer: HTMLElement): PostAuthorInfo {
    return extractAuthorInfo(postContainer);
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
}
