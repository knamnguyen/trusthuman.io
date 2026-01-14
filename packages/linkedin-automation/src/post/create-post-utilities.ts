/**
 * Factory for creating PostUtilities instance.
 * Auto-detects DOM version and returns appropriate implementation.
 */

import { detectDomVersion } from "../dom/detect";
import { PostUtilitiesV1 } from "./PostUtilitiesV1";
import { PostUtilitiesV2 } from "./PostUtilitiesV2";
import type { PostUtilities } from "./types";

/**
 * Create PostUtilities instance based on detected DOM version.
 * @returns PostUtilities implementation for current DOM version
 */
export function createPostUtilities(): PostUtilities {
  const version = detectDomVersion();

  if (version === "dom-v2") {
    return new PostUtilitiesV2();
  }

  return new PostUtilitiesV1();
}
