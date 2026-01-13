import type { PostUtilities } from "./types";
import { findPostContainer } from "./utils-v1/find-post-container";

export class PostUtilitiesV1 implements PostUtilities {
  findPostContainer(anchorElement: Element): Element | null {
    return findPostContainer(anchorElement);
  }
}
