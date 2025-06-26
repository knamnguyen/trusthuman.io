import { z } from "zod";

export const VideoStitchClipSchema = z.object({
  range: z
    .string()
    .regex(
      /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/,
      "Time range must be in format MM:SS-MM:SS or HH:MM-HH:MM",
    ),
  caption: z
    .string()
    .max(200, "Caption must be 200 characters or less")
    .optional(),
});

export const VideoStitchInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  clips: z
    .array(VideoStitchClipSchema)
    .min(1, "At least one clip is required")
    .max(20, "Maximum 20 clips allowed"),
  originalDuration: z.number().positive("Original duration must be positive"),
});

export const CombineVideosInputSchema = z.object({
  shortHookUrl: z.string().url("Valid short hook video URL is required"),
  shortDemoUrl: z.string().url("Valid short demo video URL is required"),
  originalHookUrl: z.string().url("Valid original hook video URL is required"),
  shortHookDuration: z
    .number()
    .positive("Short hook duration must be positive"),
  shortDemoDuration: z
    .number()
    .positive("Short demo duration must be positive"),
  originalHookDuration: z
    .number()
    .positive("Original hook duration must be positive"),
});

export type VideoStitchClip = z.infer<typeof VideoStitchClipSchema>;
export type VideoStitchInput = z.infer<typeof VideoStitchInputSchema>;
export type CombineVideosInput = z.infer<typeof CombineVideosInputSchema>;
