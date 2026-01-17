import type { CommentUtilities } from "./types";
import { createProxiedUtilities } from "../create-proxied-utilities";
import { CommentUtilitiesV1 } from "./CommentUtilitiesV1";
import { CommentUtilitiesV2 } from "./CommentUtilitiesV2";

/**
 * Create CommentUtilities instance based on detected DOM version.
 */
export function createCommentUtilities(): CommentUtilities {
  return createProxiedUtilities(
    new CommentUtilitiesV1(),
    new CommentUtilitiesV2(),
  );
}
