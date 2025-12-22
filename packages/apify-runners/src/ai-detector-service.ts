import { ApifyClient } from "apify-client";
import { z } from "zod";

/**
 * Apify AI Detector Input Schema
 * Actor ID: RoYpcsjrPfLmPCkZJ
 */
export const AIDetectorInputSchema = z.object({
  textContent: z.string().min(1, "Text content cannot be empty"),
  proxyConfiguration: z.object({
    useApifyProxy: z.boolean(),
  }),
});

export type AIDetectorInput = z.infer<typeof AIDetectorInputSchema>;

/**
 * Apify AI Detector Output Schema
 * Represents the analysis result from the actor
 *
 * NOTE: Actual schema differs from initial specification.
 * The actor returns blocks[].result.{fake, real} instead of blocks[].{original, ai}
 */
export const AIDetectorBlockSchema = z.object({
  text: z.string(),
  result: z.object({
    fake: z
      .number()
      .describe("Percentage score for AI-generated content (0-1)"),
    real: z.number().describe("Percentage score for original content (0-1)"),
    status: z.string().describe("Analysis status (usually 'success')"),
  }),
});

export const AIDetectorOutputSchema = z.object({
  original: z.number().describe("Percentage score for original content (0-1)"),
  ai: z.number().describe("Percentage score for AI-generated content (0-1)"),
  blocks: z.array(AIDetectorBlockSchema).describe("Per-block analysis results"),
});

export type AIDetectorOutput = z.infer<typeof AIDetectorOutputSchema>;
export type AIDetectorBlock = z.infer<typeof AIDetectorBlockSchema>;

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
      throw new Error(`Invalid AI detector output: ${parsed.error.message}`);
    }

    return parsed.data;
  }
}
