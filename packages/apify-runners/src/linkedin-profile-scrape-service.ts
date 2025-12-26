import { ApifyClient } from "apify-client";

export interface LinkedInProfileScrapeConfig {
  token: string;
  actorId?: string;
}

export type ProfileScraperMode =
  | "Profile details no email ($4 per 1k)"
  | "Profile details with email ($30 per 1k)";

const DEFAULT_ACTOR_ID = "LpVuK3Zozwuipa5bp";

/**
 * Service for scraping LinkedIn profile data using Apify actor
 * Actor ID: LpVuK3Zozwuipa5bp
 */
export class LinkedInProfileScrapeService {
  private client: ApifyClient;
  private actorId: string;

  constructor(config: LinkedInProfileScrapeConfig) {
    this.client = new ApifyClient({ token: config.token });
    this.actorId = config.actorId ?? DEFAULT_ACTOR_ID;
  }

  /**
   * Scrape a single LinkedIn profile
   * @param profileUrl - LinkedIn profile URL to scrape
   * @param mode - Scraper mode (with or without email)
   * @returns Profile data or null if not found
   */
  async scrapeSingleProfile({
    profileUrl,
    mode = "Profile details no email ($4 per 1k)",
  }: {
    profileUrl: string;
    mode?: ProfileScraperMode;
  }): Promise<unknown | null> {
    if (!profileUrl) return null;

    const input = {
      profileScraperMode: mode,
      queries: [profileUrl],
    };

    const run = await this.client.actor(this.actorId).call(input);

    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    return items?.[0] ?? null;
  }

  /**
   * Scrape multiple LinkedIn profiles
   * @param profileUrls - Array of LinkedIn profile URLs to scrape
   * @param mode - Scraper mode (with or without email)
   * @returns Array of profile data
   */
  async scrapeManyProfiles({
    profileUrls,
    mode = "Profile details no email ($4 per 1k)",
  }: {
    profileUrls: string[];
    mode?: ProfileScraperMode;
  }): Promise<unknown[]> {
    if (!Array.isArray(profileUrls) || profileUrls.length === 0) return [];

    const input = {
      profileScraperMode: mode,
      queries: profileUrls,
    };

    const run = await this.client.actor(this.actorId).call(input);

    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    return items as unknown[];
  }
}
