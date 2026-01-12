import type { AccountUtilities } from "./types";
import { detectDomVersion } from "../dom/detect";
import { AccountUtilitiesV1 } from "./AccountUtilitiesV1";
import { AccountUtilitiesV2 } from "./AccountUtilitiesV2";

/**
 * Create AccountUtilities instance based on detected DOM version.
 */
export function createAccountUtilities(): AccountUtilities {
  return detectDomVersion() === "dom-v2"
    ? new AccountUtilitiesV2()
    : new AccountUtilitiesV1();
}
