import { z } from "zod";

/**
 * Social platform enum for submission
 */
export const socialPlatformSchema = z.enum(["x", "linkedin", "threads", "facebook"]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

/**
 * Submit post schema - for creating new social submission
 */
export const submitPostSchema = z.object({
  platform: socialPlatformSchema,
  postUrl: z.string().url("Invalid post URL"),
});
export type SubmitPostInput = z.infer<typeof submitPostSchema>;

/**
 * Get submission status schema
 */
export const getSubmissionStatusSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
});
export type GetSubmissionStatusInput = z.infer<typeof getSubmissionStatusSchema>;

/**
 * List submissions schema
 */
export const listSubmissionsSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(10),
  offset: z.number().int().nonnegative().optional().default(0),
});
export type ListSubmissionsInput = z.infer<typeof listSubmissionsSchema>;
