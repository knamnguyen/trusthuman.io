import { z } from "zod";

export const VideoStitchClipSchema = z.object({
  range: z.string().regex(
    /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/,
    "Time range must be in format MM:SS-MM:SS or HH:MM-HH:MM"
  ),
  caption: z.string().max(200, "Caption must be 200 characters or less").optional(),
});

export const VideoStitchInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  clips: z
    .array(VideoStitchClipSchema)
    .min(1, "At least one clip is required")
    .max(20, "Maximum 20 clips allowed"),
  originalDuration: z.number().positive("Original duration must be positive"),
});

export type VideoStitchClip = z.infer<typeof VideoStitchClipSchema>;
export type VideoStitchInput = z.infer<typeof VideoStitchInputSchema>;
