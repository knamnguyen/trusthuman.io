import type { AccountUtilities, LinkedInProfile } from "./types";
import {
  extractCurrentProfile,
  extractCurrentProfileAsync,
} from "./utils-v2/extract-current-profile";

export class AccountUtilitiesV2 implements AccountUtilities {
  extractCurrentProfile(): LinkedInProfile {
    return extractCurrentProfile();
  }

  extractCurrentProfileAsync(timeoutMs?: number): Promise<LinkedInProfile> {
    return extractCurrentProfileAsync(timeoutMs);
  }
}
