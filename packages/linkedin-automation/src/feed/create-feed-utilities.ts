import type { FeedUtilities } from "./types";
import { createProxiedUtilities } from "../create-proxied-utilities";
import { FeedUtilitiesV1 } from "./FeedUtilitiesV1";
import { FeedUtilitiesV2 } from "./FeedUtilitiesV2";

/**
 * Create FeedUtilities instance based on detected DOM version.
 */
export function createFeedUtilities(): FeedUtilities {
  return createProxiedUtilities(new FeedUtilitiesV1(), new FeedUtilitiesV2());
}
