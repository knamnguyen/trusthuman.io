import type {
  SocialPlatform,
  SocialVerifier,
  VerifyKeywordsInput,
  VerifyKeywordsResult,
} from "./types";
import { FacebookVerifier } from "./platforms/facebook-verifier";
import { LinkedInVerifier } from "./platforms/linkedin-verifier";
import { ThreadsVerifier } from "./platforms/threads-verifier";
import { XVerifier } from "./platforms/x-verifier";
import { detectPlatform } from "./utils/detect-platform";
import { normalizeUrl } from "./utils/normalize-url";

type ServiceDependencies = {
  verifiers?: Partial<Record<SocialPlatform, SocialVerifier>>;
};

export class SocialReferralService {
  private verifiers: Map<SocialPlatform, SocialVerifier>;

  constructor(dependencies: ServiceDependencies = {}) {
    this.verifiers = new Map();
    const xVerifier = dependencies.verifiers?.x ?? new XVerifier();
    const threadsVerifier =
      dependencies.verifiers?.threads ?? new ThreadsVerifier();
    const facebookVerifier =
      dependencies.verifiers?.facebook ?? new FacebookVerifier();
    const linkedinVerifier =
      dependencies.verifiers?.linkedin ?? new LinkedInVerifier();
    this.verifiers.set("x", xVerifier);
    this.verifiers.set("threads", threadsVerifier);
    this.verifiers.set("facebook", facebookVerifier);
    this.verifiers.set("linkedin", linkedinVerifier);
  }

  async verifyKeywords(
    input: VerifyKeywordsInput,
  ): Promise<VerifyKeywordsResult> {
    const normalizedUrl = normalizeUrl(input.url);
    const platform = input.platform ?? detectPlatform(normalizedUrl);
    const verifier = this.verifiers.get(platform);
    if (!verifier) {
      throw new Error(`Unsupported social platform: ${platform}`);
    }
    const result = await verifier.verifyKeywords({
      url: normalizedUrl,
      keywords: input.keywords,
    });
    return {
      ...result,
      url: normalizedUrl,
      likes:
        typeof (result as Partial<VerifyKeywordsResult>).likes === "number"
          ? result.likes
          : 0,
      comments:
        typeof (result as Partial<VerifyKeywordsResult>).comments === "number"
          ? result.comments
          : 0,
      shares:
        typeof (result as Partial<VerifyKeywordsResult>).shares === "number"
          ? result.shares
          : 0,
    };
  }
}
