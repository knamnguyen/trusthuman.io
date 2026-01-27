import { ApifyClient } from "apify-client";

import type { SocialVerifier, VerifyKeywordsResult } from "../types";

const DEFAULT_ACTOR_ID = "Wpp1BZ6yGWjySadk3";

const LINKEDIN_REGEX = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/?.*/i;

type LinkedInVerifierConfig = {
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

type LinkedInDatasetItem = {
  text?: string;
  numLikes?: number;
  numComments?: number;
  numShares?: number;
};

const validateLinkedInUrl = (url: string): void => {
  if (!LINKEDIN_REGEX.test(url)) {
    throw new Error("Invalid LinkedIn post URL");
  }
};

const isValidLinkedInItem = (item: unknown): item is LinkedInDatasetItem => {
  if (!item || typeof item !== "object") return false;
  const datasetItem = item as Record<string, unknown>;
  const text = datasetItem.text;
  if (typeof text !== "string") return false;
  return text.trim().length > 0;
};

/**
 * Verifies keywords in LinkedIn posts using Apify scraper.
 */
export class LinkedInVerifier implements SocialVerifier {
  private client: ApifyClient | null = null;
  private apiToken: string | undefined;
  private actorId: string;
  private providedClient: ApifyClient | undefined;

  constructor(config: LinkedInVerifierConfig = {}) {
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

    validateLinkedInUrl(url);
    const client = this.getClient();
    const run = await this.callActor(client, {
      deepScrape: true,
      urls: [url],
    });
    if (!run.defaultDatasetId) {
      throw new Error("Apify run did not return a dataset ID");
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems({
      limit: 5,
    });
    const items = Array.isArray(dataset.items) ? dataset.items : [];
    const validItem = items.find(isValidLinkedInItem);
    if (!validItem?.text) {
      throw new Error("Apify dataset did not contain LinkedIn text");
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
      platform: "linkedin",
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

  private extractEngagement(item: LinkedInDatasetItem): {
    likes: number;
    comments: number;
    shares: number;
  } {
    return {
      likes: item.numLikes ?? 0,
      comments: item.numComments ?? 0,
      shares: item.numShares ?? 0,
    };
  }

  private async callActor(
    client: ApifyClient,
    input: Record<string, unknown>,
  ): Promise<ApifyRun> {
    const run = await client.actor(this.actorId).call(input);
    return run as ApifyRun;
  }
}
