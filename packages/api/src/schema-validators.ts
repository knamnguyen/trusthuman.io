import { z } from "zod";

/**
 * AI Comment Generation Schema Validators
 *
 * Zod schemas for validating AI comment generation requests and responses
 * Used by both tRPC procedures and Chrome extension client
 */

// Input schema for generating AI comments
export const commentGenerationInputSchema = z.object({
  postContent: z.string().min(1, "Post content is required"),
  styleGuide: z.string().min(1, "Style guide is required").optional(),
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
});

// Output schema for AI comment generation
export const commentGenerationOutputSchema = z.object({
  comment: z.string(),
  success: z.boolean(),
  fallback: z.boolean().optional(),
  error: z.string().optional(),
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
export type CommentGenerationOutput = z.infer<
  typeof commentGenerationOutputSchema
>;
export type CommentGeneratorConfig = z.infer<
  typeof commentGeneratorConfigSchema
>;
export type CommentGeneratorError = z.infer<typeof commentGeneratorErrorSchema>;
