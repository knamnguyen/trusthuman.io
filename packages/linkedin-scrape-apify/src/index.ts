import { ApifyClient } from "apify-client";

import type { ProfileData } from "./schema-validators";
import {
  ApifyLinkedInItemSchema,
  ProfileDataSchema,
} from "./schema-validators";

export type { ApifyLinkedInItem } from "./schema-validators";

export interface ApifyConfig {
  token: string;
  actorId: string;
}

/**
 * Profile data interface
 */
export type { ProfileData };

export class LinkedInScrapeApifyService {
  private client: ApifyClient;
  private actorId: string;

  constructor(config: ApifyConfig) {
    this.client = new ApifyClient({ token: config.token });
    this.actorId = config.actorId;
  }

  async runSingleProfile({
    profileUrl,
  }: {
    profileUrl: string;
  }): Promise<ProfileData | null> {
    if (!profileUrl) return null;

    const first = await this.runSingleProfileItem({ profileUrl });
    if (!first) return null;

    const mapped: ProfileData = ProfileDataSchema.parse({
      profilePhotoUrl: first.profilePic ?? undefined,
      profileUrl: first.linkedinUrl ?? profileUrl,
      fullName: first.fullName ?? undefined,
      headline: first.headline ?? undefined,
      profileUrn: first.urn ?? undefined,
    });

    return mapped;
  }

  async runSingleProfileItem({ profileUrl }: { profileUrl: string }) {
    if (!profileUrl) return null;
    console.log("running single profile item");
    console.log("profileUrl is: " + profileUrl);
    const run = await this.client.actor(this.actorId).call({
      profileUrls: [profileUrl],
    });
    console.log("run completed");
    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();
    const firstRaw = items?.[0] as unknown;
    const parsed = ApifyLinkedInItemSchema.safeParse(firstRaw);
    if (!parsed.success) return null;
    return parsed.data;
  }

  async runManyProfileItems({
    profileUrls,
  }: {
    profileUrls: string[];
  }): Promise<unknown[]> {
    if (!Array.isArray(profileUrls) || profileUrls.length === 0) return [];
    console.log("running many profile items");
    console.log("count:", profileUrls.length);
    const run = await this.client.actor(this.actorId).call({
      profileUrls,
    });
    console.log("bulk run completed");
    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();
    return items as unknown[];
  }
}
