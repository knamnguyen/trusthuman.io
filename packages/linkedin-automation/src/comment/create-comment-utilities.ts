import type { CommentUtilities } from "./types";
import { detectDomVersion } from "../dom/detect";
import { CommentUtilitiesV1 } from "./CommentUtilitiesV1";
import { CommentUtilitiesV2 } from "./CommentUtilitiesV2";

/**
 * Create CommentUtilities instance based on detected DOM version.
 */
export function createCommentUtilities(): CommentUtilities {
  return detectDomVersion() === "dom-v2"
    ? new CommentUtilitiesV2()
    : new CommentUtilitiesV1();
}
