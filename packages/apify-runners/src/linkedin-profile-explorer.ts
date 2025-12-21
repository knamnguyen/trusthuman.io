import { ApifyClient } from "apify-client";

export class LinkedInProfileExplorer {
  private client: ApifyClient;
  private actorId: string;

  constructor(config: { token: string; actorId: string }) {
    this.client = new ApifyClient({ token: config.token });
    this.actorId = config.actorId;
  }

  async searchProfile() {}
}
