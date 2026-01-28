// Main service
export { SocialReferralService } from "./social-referral-service";

// Platform verifiers
export { XVerifier } from "./platforms/x-verifier";
export { LinkedInVerifier } from "./platforms/linkedin-verifier";
export { FacebookVerifier } from "./platforms/facebook-verifier";
export { ThreadsVerifier } from "./platforms/threads-verifier";

// Types
export type {
  SocialPlatform,
  SocialVerifier,
  VerifyKeywordsInput,
  VerifyKeywordsResult,
} from "./types";

// Utilities
export { detectPlatform } from "./utils/detect-platform";
export { normalizeUrl } from "./utils/normalize-url";
export { extractTweetId } from "./utils/extract-tweet-id";
