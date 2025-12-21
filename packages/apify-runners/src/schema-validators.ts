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
    fake: z.number().describe("Percentage score for AI-generated content (0-1)"),
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
