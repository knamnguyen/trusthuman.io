import { z } from "zod";

/**
 * AI Comment Generation Schema Validators
 *
 * Zod schemas for validating AI comment generation requests and responses
 * Used by both tRPC procedures and Chrome extension client
 */

// TODO: make all generatecomments endpoint use the generateComment endpoint no generate dynamic comment endpoint
// Input schema for generating AI comments
export const commentGenerationInputSchema = z.object({
  postContent: z.string().min(1, "Post content is required"),
  styleGuide: z.string().min(1, "Style guide is required").optional(),
  styleId: z.string().optional(),
  adjacentComments: z
    .array(
      z.object({
        commentContent: z.string(),
        likeCount: z.number(),
        replyCount: z.number(),
      }),
    )
    .min(0)
    .or(z.string())
    .optional(),
  /** Previous AI-generated comment (for regeneration) */
  previousAiComment: z.string().optional(),
  /** Human-edited version of the comment (for regeneration to learn from) */
  humanEditedComment: z.string().optional(),
  /** AI Generation Config from CommentStyle */
  /** Maximum words for generated comment (1-300), default 100 */
  maxWords: z.number().min(1).max(300).optional(),
  /** Creativity level / temperature (0-2), default 1.0 */
  creativity: z.number().min(0).max(2).optional(),
});

// Configuration schema for AI comment generator
export const commentGeneratorConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  styleGuide: z.string().min(1, "Style guide is required"),
});

// Error details schema for comprehensive error reporting
export const commentGeneratorErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  name: z.string(),
  apiKey: z.string(),
  styleGuide: z.string(),
  postContentLength: z.number(),
  timestamp: z.string(),
  type: z.string().optional(),
});

// Type exports for use in other files
export type CommentGenerationInput = z.infer<
  typeof commentGenerationInputSchema
>;
export type CommentGeneratorConfig = z.infer<
  typeof commentGeneratorConfigSchema
>;
export type CommentGeneratorError = z.infer<typeof commentGeneratorErrorSchema>;

/**
 * Dynamic Style Selection Schemas
 *
 * Used by the generateDynamic route for AI-powered style selection
 */

// Style snapshot schema - null when using hardcoded defaults
export const styleSnapshotSchema = z
  .object({
    name: z.string().nullable(),
    content: z.string(),
    maxWords: z.number(),
    creativity: z.number(),
  })
  .nullable();

// Type exports for dynamic style selection
export type GenerateDynamicInput = z.infer<typeof generateDynamicInputSchema>;
export type StyleSnapshot = z.infer<typeof styleSnapshotSchema>;

/**
 * Analytics Sync Schemas
 *
 * Used by the weekly analytics email feature to sync LinkedIn metrics
 * from the extension to the database
 */

// Input schema for syncing daily LinkedIn analytics metrics
export const analyticsSyncInputSchema = z.object({
  followers: z.number().int().nonnegative(),
  invites: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  contentReach: z.number().int().nonnegative(),
  profileViews: z.number().int().nonnegative(),
  engageReach: z.number().int().nonnegative(),
  // Optional date - defaults to today (normalized to start-of-day UTC)
  date: z.date().or(z.string().datetime()).optional(),
});

// Type export for analytics sync input
export type AnalyticsSyncInput = z.infer<typeof analyticsSyncInputSchema>;
