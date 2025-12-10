import { ApifyClient } from "apify-client";

import type { AIDetectorOutput } from "./schema-validators";
import {
  AIDetectorInputSchema,
  AIDetectorOutputSchema,
} from "./schema-validators";

export interface AIDetectorConfig {
  token: string;
  actorId: string;
}

/**
 * Service for detecting AI-generated content using Apify actor
 * Actor ID: RoYpcsjrPfLmPCkZJ
 */
export class AIDetectorService {
  private client: ApifyClient;
  private actorId: string;

  constructor(config: AIDetectorConfig) {
    this.client = new ApifyClient({ token: config.token });
    this.actorId = config.actorId;
  }

  /**
   * Analyze text content to detect AI generation
   * @param text - Text content to analyze
   * @returns AI detection results with original/ai scores
   * @throws Error if analysis fails or returns invalid data
   */
  async analyzeText(text: string): Promise<AIDetectorOutput> {
    // Validate input
    const input = AIDetectorInputSchema.parse({
      textContent: text,
      proxyConfiguration: {
        useApifyProxy: true,
      },
    });

    // Run actor
    const run = await this.client.actor(this.actorId).call(input);

    // Fetch results from dataset
    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    const firstResult = items?.[0] as unknown;

    // Validate output
    const parsed = AIDetectorOutputSchema.safeParse(firstResult);

    if (!parsed.success) {
      throw new Error(
        `Invalid AI detector output: ${parsed.error.message}`
      );
    }

    return parsed.data;
  }
}
