import type { ProfileUtilities } from "./types";
import { createProxiedUtilities } from "../create-proxied-utilities";
import { ProfileUtilitiesV1 } from "./ProfileUtilitiesV1";
import { ProfileUtilitiesV2 } from "./ProfileUtilitiesV2";

/**
 * Create ProfileUtilities instance based on detected DOM version.
 */
export function createProfileUtilities(): ProfileUtilities {
  return createProxiedUtilities(
    new ProfileUtilitiesV1(),
    new ProfileUtilitiesV2(),
  );
}
