import { z } from "zod";

// Configuration schema for Gemini Video Service
export const GeminiVideoConfigSchema = z.object({
  apiKey: z.string().min(1, "Gemini API key is required"),
});

// Input schema for viral hook extraction
export const ViralHookInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
});

// Output schema for viral hook extraction (matches VideoStitch requirements)
export const ViralHookResponseSchema = z.object({
  hookEndTimestamp: z
    .string()
    .regex(/^(\d{1,2}):(\d{2})$/, "Hook end timestamp must be in MM:SS format"),
  confidence: z.string().optional(),
  description: z.string().optional(),
});

// Input schema for demo video condensing
export const DemoVideoInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  maxDuration: z.number().positive("Max duration must be positive"),
  numSegments: z
    .number()
    .int()
    .min(1)
    .max(20, "Number of segments must be between 1 and 20"),
});

// Individual segment schema (matches VideoStitch clip format)
export const VideoSegmentSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(100, "Caption must be 100 characters or less"),
  start: z.number().nonnegative("Start time must be non-negative"),
  end: z.number().positive("End time must be positive"),
});

// Output schema for demo video condensing
export const DemoVideoResponseSchema = z.object({
  segments: z
    .array(VideoSegmentSchema)
    .min(1, "At least one segment is required"),
  totalDuration: z.number().positive("Total duration must be positive"),
  productInfo: z
    .string()
    .min(10, "Product info must be at least 10 characters")
    .max(
      800,
      "Product info must be 800 characters or less (approximately 100 words)",
    ),
});

// General video processing input schema
export const VideoProcessingInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  prompt: z.string().min(1, "Prompt is required"),
});

// Gemini file upload response schema
export const GeminiFileResponseSchema = z.object({
  name: z.string(),
  uri: z.string(),
  mimeType: z.string(),
});

// Type exports
export type GeminiVideoConfig = z.infer<typeof GeminiVideoConfigSchema>;
export type ViralHookInput = z.infer<typeof ViralHookInputSchema>;
export type ViralHookResponse = z.infer<typeof ViralHookResponseSchema>;
export type DemoVideoInput = z.infer<typeof DemoVideoInputSchema>;
export type DemoVideoResponse = z.infer<typeof DemoVideoResponseSchema>;
export type VideoSegment = z.infer<typeof VideoSegmentSchema>;
export type VideoProcessingInput = z.infer<typeof VideoProcessingInputSchema>;
export type GeminiFileResponse = z.infer<typeof GeminiFileResponseSchema>;
