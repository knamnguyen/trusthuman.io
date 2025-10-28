import { z } from "zod";

// Make primitive types more restrictive for early validation
export const idSchema = z.string().min(1);
export const stringFieldSchema = z.string().min(1);
export const contentSchema = z.string().min(1);
export const urlSchema = z.string().url().optional().nullable();
export const cuidSchema = z.string().cuid();

export const createEntryInputSchema = z.object({
  content: z.string().min(1, { message: "Entry content cannot be empty." }),
});
export type CreateEntryInput = z.infer<typeof createEntryInputSchema>;

export const upvoteEntryInputSchema = z.object({
  entryId: z.string().cuid({ message: "Invalid entry ID format." }),
});
export type UpvoteEntryInput = z.infer<typeof upvoteEntryInputSchema>;

export const getPublicTimelineInputSchema = z.object({
  username: z.string().min(1, { message: "Username cannot be empty." }),
});
export type GetPublicTimelineInput = z.infer<
  typeof getPublicTimelineInputSchema
>;

// Individual video segment schema (shared between packages)
export const VideoSegmentSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption is required and should be less than 150 characters"),
  start: z
    .number()
    .int()
    .nonnegative("Start time must be a non-negative integer"),
  end: z.number().int().positive("End time must be a positive integer"),
});

// Type export for video segment
export type VideoSegment = z.infer<typeof VideoSegmentSchema>;

export const storageStateSchema = z.object({
  scrollDuration: z.number(),
  commentDelay: z.number(),
  customStyleGuides: z.array(
    z.object({
      name: z.string(),
      prompt: z.string(),
    }),
  ),
  commentCount: z.number(),
  status: z.string(),
  maxPosts: z.number(),
  duplicateWindow: z.number(),
  styleGuide: z.string(),
  apiKey: z.string().optional(),
  commentAsCompanyEnabled: z.boolean(),
  timeFilterEnabled: z.boolean(),
  minPostAge: z.number(),
  finishListModeEnabled: z.boolean(),
  targetListEnabled: z.boolean(),
  totalTodayComments: z.number(),
  selectedTargetList: z.string(),
  commentProfileName: z.string(),
  languageAwareEnabled: z.boolean(),
  skipCompanyPagesEnabled: z.boolean(),
  skipPromotedPostsEnabled: z.boolean(),
  skipFriendsActivitiesEnabled: z.boolean(),
  blacklistEnabled: z.boolean(),
  targetListOptions: z.array(z.string()),
  blacklistAuthors: z.array(z.string()),
  manualApproveEnabled: z.boolean(),
  authenticityBoostEnabled: z.boolean(),
  profileRecord: z.record(
    z.string(),
    z.object({
      profileUrn: z.string().optional(),
      lists: z.array(z.string()).optional(),
    }),
  ),
  hasEverSignedIn: z.boolean(),
  totalAllTimeComments: z.number(),
  isRunning: z.boolean(),
  authorsFound: z.array(z.string()),
  authorsMissing: z.array(z.string()),
  authorsPending: z.array(z.string()),
  authorsCommented: z.array(z.string()),
  currentCommentCount: z.number(),
  postsSkippedDuplicate: z.number(),
  recentAuthorsDetected: z.number(),
  postsSkippedAlreadyCommented: z.number(),
  duplicatePostsDetected: z.number(),
  postsSkippedTimeFilter: z.number(),
  selectedStyleKey: z.string(),
});

export type StorageState = z.output<typeof storageStateSchema>;
