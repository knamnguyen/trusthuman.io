export type SocialPlatform = "x" | "linkedin" | "threads" | "facebook";

export interface VerifyKeywordsInput {
  url: string;
  keywords: readonly string[];
  platform?: SocialPlatform;
}

export interface VerifyKeywordsResult {
  platform: SocialPlatform;
  url: string;
  text: string;
  containsAll: boolean;
  missingKeywords: string[];
  matchedKeywords: string[];
  likes: number;
  comments: number;
  shares: number;
}

export interface SocialVerifier {
  verifyKeywords(input: {
    url: string;
    keywords: readonly string[];
  }): Promise<VerifyKeywordsResult>;
}
