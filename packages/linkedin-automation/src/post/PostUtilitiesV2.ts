import type { PostUrlInfo, PostUtilities } from "./types";
import { findPostContainer } from "./utils-v2/find-post-container";
import { extractPostUrl } from "./utils-v2/extract-post-url";

export class PostUtilitiesV2 implements PostUtilities {
  findPostContainer(anchorElement: Element): Element | null {
    return findPostContainer(anchorElement);
  }

  extractPostUrl(postContainer: HTMLElement): PostUrlInfo[] {
    return extractPostUrl(postContainer);
  }
}
