import type { ProfileUtilities } from "./types";
import { detectDomVersion } from "../dom/detect";
import { ProfileUtilitiesV1 } from "./ProfileUtilitiesV1";
import { ProfileUtilitiesV2 } from "./ProfileUtilitiesV2";

/**
 * Create ProfileUtilities instance based on detected DOM version.
 */
export function createProfileUtilities(): ProfileUtilities {
  return detectDomVersion() === "dom-v2"
    ? new ProfileUtilitiesV2()
    : new ProfileUtilitiesV1();
}
