import { ApifyClient } from "apify-client";

import type { SocialVerifier, VerifyKeywordsResult } from "../types";
import { extractTweetId } from "../utils/extract-tweet-id";

const DEFAULT_ACTOR_ID = "CJdippxWmn9uRfooo";

type XVerifierConfig = {
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

const X_REGEX = /^https?:\/\/(?:www\.)?x\.com\/?.*/i;

const validateXUrl = (url: string): void => {
  if (!X_REGEX.test(url)) {
    throw new Error("Invalid X URL");
  }
};

const isValidTweetItem = (item: unknown): item is { text: string } => {
  if (!item || typeof item !== "object") return false;
  const maybeText = (item as Record<string, unknown>).text;
  if (typeof maybeText !== "string") return false;
  if (!maybeText.trim()) return false;
  const maybeId = (item as Record<string, unknown>).id;
  if (typeof maybeId === "number" && maybeId === -1) return false;
  if (typeof maybeId === "string" && maybeId === "-1") return false;
  return true;
};

export class XVerifier implements SocialVerifier {
  private client: ApifyClient | null = null;
  private apiToken: string | undefined;
  private actorId: string;
  private providedClient: ApifyClient | undefined;

  constructor(config: XVerifierConfig = {}) {
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

    validateXUrl(url);
    const client = this.getClient();
    const tweetId = extractTweetId(url);
    const run = await this.callActor(client, {
      tweetIDs: [tweetId],
      maxItems: 1,
    });
    if (!run.defaultDatasetId) {
      throw new Error("Apify run did not return a dataset ID");
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems({
      limit: 5,
    });
    const { text, item } = this.resolveTweetText(dataset);
    const engagement = this.extractEngagement(item);

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
      platform: "x",
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

  private resolveTweetText(dataset: DatasetListItemsResponse): {
    text: string;
    item: unknown;
  } {
    const items = Array.isArray(dataset.items) ? dataset.items : [];
    const validItem = items.find(isValidTweetItem);
    if (!validItem) {
      throw new Error("Apify dataset did not contain tweet text");
    }
    return { text: validItem.text, item: validItem };
  }

  private extractEngagement(item: unknown): {
    likes: number;
    comments: number;
    shares: number;
  } {
    if (!item || typeof item !== "object") {
      return { likes: 0, comments: 0, shares: 0 };
    }
    const record = item as Record<string, unknown>;
    return {
      likes: typeof record.likeCount === "number" ? record.likeCount : 0,
      comments: typeof record.replyCount === "number" ? record.replyCount : 0,
      shares: typeof record.retweetCount === "number" ? record.retweetCount : 0,
    };
  }
}
