import type { AccountUtilities, LinkedInProfile } from "./types";
import {
  extractCurrentProfile,
  extractCurrentProfileAsync,
} from "./utils-v1/extract-current-profile";

export class AccountUtilitiesV1 implements AccountUtilities {
  extractCurrentProfile(): LinkedInProfile {
    return extractCurrentProfile();
  }

  extractCurrentProfileAsync(timeoutMs?: number): Promise<LinkedInProfile> {
    return extractCurrentProfileAsync();
  }
}
