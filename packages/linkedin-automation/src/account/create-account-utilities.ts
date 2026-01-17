import type { AccountUtilities } from "./types";
import { createProxiedUtilities } from "../create-proxied-utilities";
import { AccountUtilitiesV1 } from "./AccountUtilitiesV1";
import { AccountUtilitiesV2 } from "./AccountUtilitiesV2";

/**
 * Create AccountUtilities instance based on detected DOM version.
 */
export function createAccountUtilities(): AccountUtilities {
  return createProxiedUtilities(
    new AccountUtilitiesV1(),
    new AccountUtilitiesV2(),
  );
}
