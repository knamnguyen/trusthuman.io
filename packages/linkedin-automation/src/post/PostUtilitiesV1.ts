import type { PostAuthorInfo, PostUrlInfo, PostUtilities } from "./types";
import { findPostContainer } from "./utils-v1/find-post-container";
import { extractPostUrl } from "./utils-v1/extract-post-url";
import { extractAuthorInfo } from "./utils-v1/extract-author-info";
import { extractPostCaption } from "./utils-v1/extract-post-caption";

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
}
