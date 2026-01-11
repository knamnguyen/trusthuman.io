import { detectDomVersion } from "../dom/detect";
import type { FeedUtilities } from "./types";
import { FeedUtilitiesV1 } from "./FeedUtilitiesV1";
import { FeedUtilitiesV2 } from "./FeedUtilitiesV2";

/**
 * Create FeedUtilities instance based on detected DOM version.
 */
export function createFeedUtilities(): FeedUtilities {
  return detectDomVersion() === "dom-v2"
    ? new FeedUtilitiesV2()
    : new FeedUtilitiesV1();
}
