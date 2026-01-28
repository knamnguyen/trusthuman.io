import { ApifyClient } from "apify-client";

import type { SocialVerifier, VerifyKeywordsResult } from "../types";

const DEFAULT_ACTOR_ID = "KoJrdxJCTtpon81KY";

const FACEBOOK_REGEX = /^https?:\/\/(?:www\.)?facebook\.com\/?.*/i;

type FacebookVerifierConfig = {
  apiToken?: string;
  actorId?: string;
  client?: ApifyClient;
};

type ApifyRun = {
  defaultDatasetId?: string;
};

type DatasetListItemsResponse = {
  items?: unknown[];
};

type FacebookDatasetItem = {
  url?: string;
  text?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  media?: Array<{
    thumbnail?: string;
    url?: string;
  }>;
};

const validateFacebookUrl = (url: string): void => {
  if (!FACEBOOK_REGEX.test(url)) {
    throw new Error("Invalid Facebook URL");
  }
};

const isValidFacebookItem = (item: unknown): item is FacebookDatasetItem => {
  if (!item || typeof item !== "object") return false;
  const datasetItem = item as Record<string, unknown>;
  const text = datasetItem.text;
  if (typeof text !== "string") return false;
  return text.trim().length > 0;
};

/**
 * Verifies keywords in Facebook posts using Apify scraper
 * NOTE: Uses NEW Facebook actor with different response format
 */
export class FacebookVerifier implements SocialVerifier {
  private client: ApifyClient | null = null;
  private apiToken: string | undefined;
  private actorId: string;
  private providedClient: ApifyClient | undefined;

  constructor(config: FacebookVerifierConfig = {}) {
    // Store config, but don't validate or create client yet
    this.apiToken = config.apiToken;
    this.actorId = config.actorId ?? DEFAULT_ACTOR_ID;
    this.providedClient = config.client;
  }

  private getClient(): ApifyClient {
    // Lazy initialization: create client only when needed
    if (this.providedClient) {
      return this.providedClient;
    }
    if (this.client) {
      return this.client;
    }
    // Validate token at runtime (when actually used)
    const apiToken = this.apiToken ?? process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      throw new Error("APIFY_API_TOKEN is not configured");
    }
    this.client = new ApifyClient({
      token: apiToken,
    });
    return this.client;
  }

  async verifyKeywords({
    url,
    keywords,
  }: {
    url: string;
    keywords: readonly string[];
  }): Promise<VerifyKeywordsResult> {
    if (keywords.length === 0) {
      throw new Error("At least one keyword is required");
    }

    validateFacebookUrl(url);
    const client = this.getClient();
    const run = await this.callActor(client, {
      startUrls: [
        {
          url,
        },
      ],
      resultsLimit: 20,
      captionText: false,
    });
    if (!run.defaultDatasetId) {
      throw new Error("Apify run did not return a dataset ID");
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems({
      limit: 5,
    });
    const items = Array.isArray(dataset.items) ? dataset.items : [];
    const validItem = items.find(isValidFacebookItem);
    if (!validItem?.text) {
      throw new Error("Apify dataset did not contain Facebook content");
    }
    const text = validItem.text;
    const engagement = this.extractEngagement(validItem);

    const normalizedText = text.toLowerCase();
    const processedKeywords = keywords
      .map((keyword) => ({
        original: keyword,
        normalized: keyword.trim().toLowerCase(),
      }))
      .filter((entry) => entry.normalized.length > 0);

    const missingKeywords: string[] = [];
    const matchedKeywords: string[] = [];

    processedKeywords.forEach((entry) => {
      if (!normalizedText.includes(entry.normalized)) {
        missingKeywords.push(entry.original);
      } else {
        matchedKeywords.push(entry.original);
      }
    });

    return {
      platform: "facebook",
      url,
      text,
      containsAll: missingKeywords.length === 0,
      missingKeywords,
      matchedKeywords,
      likes: engagement.likes,
      comments: engagement.comments,
      shares: engagement.shares,
    };
  }

  private async callActor(
    client: ApifyClient,
    input: Record<string, unknown>,
  ): Promise<ApifyRun> {
    const run = await client.actor(this.actorId).call(input);
    return run as ApifyRun;
  }

  private extractEngagement(item: FacebookDatasetItem): {
    likes: number;
    comments: number;
    shares: number;
  } {
    return {
      likes: item.likes ?? 0,
      comments: item.comments ?? 0,
      shares: item.shares ?? 0,
    };
  }
}
