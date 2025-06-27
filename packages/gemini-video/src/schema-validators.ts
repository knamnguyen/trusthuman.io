import { z } from "zod";

import { VideoSegmentSchema } from "@sassy/validators";

// Configuration schema for Gemini Video Service
export const GeminiVideoConfigSchema = z.object({
  apiKey: z.string().min(1, "Gemini API key is required"),
});

// Color schema for individual color in palette
export const ColorSchema = z.object({
  red: z.number().int().min(0).max(255, "Red value must be 0-255"),
  green: z.number().int().min(0).max(255, "Green value must be 0-255"),
  blue: z.number().int().min(0).max(255, "Blue value must be 0-255"),
  percentage: z.number().min(0).max(1, "Percentage must be between 0 and 1"),
});

// Color palette schema - exactly 5 colors sorted by percentage descending
export const ColorPaletteSchema = z
  .array(ColorSchema)
  .length(5, "Color palette must contain exactly 5 colors")
  .refine(
    (colors) => {
      // Check if sorted by percentage descending
      for (let i = 0; i < colors.length - 1; i++) {
        const current = colors[i];
        const next = colors[i + 1];
        if (current && next && current.percentage < next.percentage) {
          return false;
        }
      }
      return true;
    },
    { message: "Colors must be sorted by percentage in descending order" },
  )
  .refine(
    (colors) => {
      // Check if percentages sum to exactly 1.0 (with small tolerance for floating point)
      const sum = colors.reduce((total, color) => total + color.percentage, 0);
      return Math.abs(sum - 1.0) < 0.001;
    },
    { message: "Color percentages must sum to exactly 1.0" },
  );

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
  hookInfo: z
    .string()
    .min(10, "Hook info must be at least 10 characters")
    .max(
      8000,
      "Hook info must be 2000 characters or less (approximately 250 words)",
    ),
  colorPalette: ColorPaletteSchema,
});

// Input schema for demo video condensing
export const DemoVideoInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  maxDuration: z.number().positive("Max duration must be positive").default(30),
  numSegments: z
    .number()
    .int()
    .min(1)
    .max(20, "Number of segments must be between 1 and 20")
    .default(3),
  contentGuide: z.string().optional(),
});

// Re-export VideoSegmentSchema for API compatibility (already imported above)

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
      8000,
      "Product info must be 2000 characters or less (approximately 250 words)",
    ),
  colorPalette: ColorPaletteSchema,
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

// Master script entry schema
export const MasterScriptEntrySchema = z.object({
  secondRange: z
    .string()
    .regex(
      /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/,
      "Second range must be in MM:SS-MM:SS format (e.g., '00:23-00:47')",
    ),
  transcript: z.string().min(0, "Transcript can be empty but must be a string"),
  frameDescription: z.string().min(1, "Frame description is required"),
});

// Input schema for master script generation
export const MasterScriptInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
});

// Output schema for master script generation
export const MasterScriptResponseSchema = z.object({
  productInfo: z
    .string()
    .min(10, "Product info must be at least 10 characters")
    .max(
      8000,
      "Product info must be 2000 characters or less (approximately 250 words)",
    ),
  colorPalette: ColorPaletteSchema,
  segments: z
    .array(MasterScriptEntrySchema)
    .min(1, "At least one master script entry is required"),
});

// Input schema for demo video condensing from master script (database-based)
export const DemoVideoFromMasterScriptInputSchema = z.object({
  demoVideoId: z.string().cuid("Valid demo video ID is required"),
  exactDuration: z
    .number()
    .positive("Exact duration must be positive")
    .max(300, "Exact duration cannot exceed 300 seconds"),
  numSegments: z
    .number()
    .int()
    .min(1)
    .max(20, "Number of segments must be between 1 and 20"),
  contentGuide: z.string().optional(),
});

// Output schema for demo video condensing from master script (segments only)
export const DemoVideoFromMasterScriptResponseSchema = z.object({
  segments: z
    .array(VideoSegmentSchema)
    .min(1, "At least one segment is required"),
  totalDuration: z.number().positive("Total duration must be positive"),
});

// Type exports
export type GeminiVideoConfig = z.infer<typeof GeminiVideoConfigSchema>;
export type Color = z.infer<typeof ColorSchema>;
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;
export type ViralHookInput = z.infer<typeof ViralHookInputSchema>;
export type ViralHookResponse = z.infer<typeof ViralHookResponseSchema>;
export type DemoVideoInput = z.infer<typeof DemoVideoInputSchema>;
export type DemoVideoResponse = z.infer<typeof DemoVideoResponseSchema>;
export type { VideoSegment } from "@sassy/validators";
export type VideoProcessingInput = z.infer<typeof VideoProcessingInputSchema>;
export type GeminiFileResponse = z.infer<typeof GeminiFileResponseSchema>;
export type MasterScriptEntry = z.infer<typeof MasterScriptEntrySchema>;
export type MasterScriptInput = z.infer<typeof MasterScriptInputSchema>;
export type MasterScriptResponse = z.infer<typeof MasterScriptResponseSchema>;
export type DemoVideoFromMasterScriptInput = z.infer<
  typeof DemoVideoFromMasterScriptInputSchema
>;
export type DemoVideoFromMasterScriptResponse = z.infer<
  typeof DemoVideoFromMasterScriptResponseSchema
>;
