import { ApifyClient } from "apify-client";

import type { SocialVerifier, VerifyKeywordsResult } from "../types";

const DEFAULT_ACTOR_ID = "7xFgGDhba8W5ZvOke";

const THREADS_REGEX = /^https?:\/\/(?:www\.)?threads\.(?:net|com)\/?.*/i;

type ThreadsVerifierConfig = {
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

type ThreadsDatasetItem = {
  thread?: {
    text?: string;
    like_count?: number;
    reply_count?: number;
    url?: string;
  };
  replies?: unknown[];
};

const validateThreadsUrl = (url: string): void => {
  if (!THREADS_REGEX.test(url)) {
    throw new Error("Invalid Threads URL");
  }
};

const isValidThreadsItem = (item: unknown): item is ThreadsDatasetItem => {
  if (!item || typeof item !== "object") return false;
  const datasetItem = item as Record<string, unknown>;
  const thread = datasetItem.thread;
  if (!thread || typeof thread !== "object") return false;
  const text = (thread as Record<string, unknown>).text;
  if (typeof text !== "string") return false;
  return text.trim().length > 0;
};

/**
 * Verifies keywords in Threads posts using Apify scraper
 */
export class ThreadsVerifier implements SocialVerifier {
  private client: ApifyClient | null = null;
  private apiToken: string | undefined;
  private actorId: string;
  private providedClient: ApifyClient | undefined;

  constructor(config: ThreadsVerifierConfig = {}) {
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

    validateThreadsUrl(url);
    const client = this.getClient();
    const run = await this.callActor(client, {
      startUrls: [
        {
          url,
        },
      ],
      proxyConfiguration: {
        useApifyProxy: true,
      },
    });
    if (!run.defaultDatasetId) {
      throw new Error("Apify run did not return a dataset ID");
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems({
      limit: 5,
    });
    const items = Array.isArray(dataset.items) ? dataset.items : [];
    const validItem = items.find(isValidThreadsItem);
    if (!validItem?.thread?.text) {
      throw new Error("Apify dataset did not contain Threads content");
    }
    const text = validItem.thread.text;
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
      platform: "threads",
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

  private extractEngagement(item: ThreadsDatasetItem): {
    likes: number;
    comments: number;
    shares: number;
  } {
    return {
      likes: item.thread?.like_count ?? 0,
      comments: item.thread?.reply_count ?? 0,
      shares: 0, // Threads doesn't expose share count
    };
  }
}
