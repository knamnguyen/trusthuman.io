import { z } from "zod";

/**
 * Zod schemas for settings models (PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting)
 * These match the Prisma models and are used for tRPC input/output validation
 */

// =============================================================================
// POST LOAD SETTING
// =============================================================================

export const postLoadSettingSchema = z.object({
  accountId: z.string(),
  targetListEnabled: z.boolean(),
  targetListIds: z.array(z.string()),

  timeFilterEnabled: z.boolean(),
  minPostAge: z.number().int().nullable(),

  skipFriendActivitiesEnabled: z.boolean(),
  skipCompanyPagesEnabled: z.boolean(),
  skipPromotedPostsEnabled: z.boolean(),
  skipBlacklistEnabled: z.boolean(),
  blacklistId: z.string().nullable(),

  skipFirstDegree: z.boolean(),
  skipSecondDegree: z.boolean(),
  skipThirdDegree: z.boolean(),
  skipFollowing: z.boolean(),

  skipCommentsLoading: z.boolean(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PostLoadSetting = z.infer<typeof postLoadSettingSchema>;

// Schema for upsert input (excludes read-only fields)
export const postLoadSettingUpsertSchema = postLoadSettingSchema
  .omit({ accountId: true, createdAt: true, updatedAt: true })
  .partial();

export type PostLoadSettingUpsert = z.infer<typeof postLoadSettingUpsertSchema>;

// =============================================================================
// SUBMIT COMMENT SETTING
// =============================================================================

export const submitCommentSettingSchema = z.object({
  accountId: z.string(),

  submitDelayRange: z.string(),
  likePostEnabled: z.boolean(),
  likeCommentEnabled: z.boolean(),
  tagPostAuthorEnabled: z.boolean(),
  attachPictureEnabled: z.boolean(),
  defaultPictureAttachUrl: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubmitCommentSetting = z.infer<typeof submitCommentSettingSchema>;

// Schema for upsert input (excludes read-only fields)
export const submitCommentSettingUpsertSchema = submitCommentSettingSchema
  .omit({ accountId: true, createdAt: true, updatedAt: true })
  .partial();

export type SubmitCommentSettingUpsert = z.infer<typeof submitCommentSettingUpsertSchema>;

// =============================================================================
// COMMENT GENERATE SETTING
// =============================================================================

export const commentGenerateSettingSchema = z.object({
  accountId: z.string(),

  commentStyleId: z.string().nullable(),
  dynamicChooseStyleEnabled: z.boolean(),
  adjacentCommentsEnabled: z.boolean(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CommentGenerateSetting = z.infer<typeof commentGenerateSettingSchema>;

// Schema for upsert input (excludes read-only fields)
export const commentGenerateSettingUpsertSchema = commentGenerateSettingSchema
  .omit({ accountId: true, createdAt: true, updatedAt: true })
  .partial();

export type CommentGenerateSettingUpsert = z.infer<typeof commentGenerateSettingUpsertSchema>;
