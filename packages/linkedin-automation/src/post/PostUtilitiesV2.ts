import type { PostUtilities } from "./types";
import { findPostContainer } from "./utils-v2/find-post-container";

export class PostUtilitiesV2 implements PostUtilities {
  findPostContainer(anchorElement: Element): Element | null {
    return findPostContainer(anchorElement);
  }
}
