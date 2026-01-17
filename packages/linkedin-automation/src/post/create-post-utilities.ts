/**
 * Factory for creating PostUtilities instance.
 * Auto-detects DOM version and returns appropriate implementation.
 */

import type { PostUtilities } from "./types";
import { createProxiedUtilities } from "../create-proxied-utilities";
import { PostUtilitiesV1 } from "./PostUtilitiesV1";
import { PostUtilitiesV2 } from "./PostUtilitiesV2";

/**
 * Create PostUtilities instance based on detected DOM version.
 * @returns PostUtilities implementation for current DOM version
 */
export function createPostUtilities(): PostUtilities {
  return createProxiedUtilities(new PostUtilitiesV1(), new PostUtilitiesV2());
}
